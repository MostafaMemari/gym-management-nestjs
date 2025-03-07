import { BadRequestException, ForbiddenException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IChargeWallet } from '../../common/interfaces/wallet.interface';
import { WalletRepository } from './wallet.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { WalletMessages } from '../../common/enums/wallet.messages';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Services } from '../../common/enums/services.enum';
import { WalletPatterns } from '../../common/enums/wallet.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ClubPatterns } from '../../common/enums/club.events';
import { NotificationPatterns } from '../../common/enums/notification.events';
import { UserRepository } from '../user/user.repository';
import { Role, Wallet } from '@prisma/client';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly timeout = 4500;
  private readonly DAILY_COST_PER_STUDENT = 50000 / 30;

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly userRepository: UserRepository,
    @Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy,
    @Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy,
  ) {}

  async findAll(): Promise<ServiceResponse> {
    try {
      const wallets = await this.walletRepository.findAll();

      return ResponseUtil.success({ wallets }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);
      //TODO: Add message
      if (wallet.isBlocked) throw new BadRequestException();

      return ResponseUtil.success({ wallet }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOneByUser({ userId }: { userId: number }) {
    try {
      const wallet = await this.walletRepository.findOneByUser(userId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);
      //TODO: Add message
      if (wallet.isBlocked) throw new ForbiddenException();

      return ResponseUtil.success({ wallet }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async block({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);
      if (wallet.isBlocked) throw new BadRequestException(WalletMessages.AlreadyBlockedWallet);

      await this.walletRepository.update(wallet.userId, { isBlocked: true });

      return ResponseUtil.success({}, WalletMessages.BlockedWalletSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async unblock({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

      await this.walletRepository.update(wallet.userId, { isBlocked: false });

      return ResponseUtil.success({}, WalletMessages.UnBlockedWalletSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async chargeWallet(chargeDto: IChargeWallet): Promise<ServiceResponse> {
    try {
      const { amount, userId } = chargeDto;
      //TODO: Add message to enum
      if (amount <= 0) throw new BadRequestException('Amount must be greater than zero.');

      let wallet = await this.walletRepository.findOneByUser(userId);

      //TODO: Add message to enum
      if (wallet?.isBlocked) throw new BadRequestException('Wallet is blocked.');

      if (!wallet) wallet = await this.walletRepository.create({ userId });

      wallet.balance += amount;
      await this.walletRepository.update(userId, { balance: wallet.balance });

      if (wallet.isWalletDepleted) {
        await this.handleWalletRecovery(wallet);
      }

      return ResponseUtil.success({ wallet }, WalletMessages.ChargedWalletSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  @Cron(CronExpression.EVERY_12_HOURS)
  async processDailyWithdraw(): Promise<void> {
    this.logger.log('Starting daily withdrawal process...');

    try {
      const wallets = await this.walletRepository.findAll({ where: { isBlocked: false } });
      this.logger.log(`Found ${wallets.length} active wallets for processing.`);

      for (const wallet of wallets) {
        if (!this.shouldWithdraw(wallet.lastWithdrawalDate)) continue;

        await this.withdrawDailyCharge(wallet);
      }

      this.logger.log('Daily withdrawal process completed successfully.');
    } catch (error) {
      this.logger.error(`Failed to process withdraw: ${error.message}`, error.stack);
      //TODO: Add message to enum
      await this.notifySuperAdmin('Daily withdrawal process failed.');
    }
  }

  private async withdrawDailyCharge(wallet: Wallet): Promise<void> {
    const { userId } = wallet;
    const studentCount = await this.getStudentCount(userId);
    if (studentCount === 0) return;

    const dailyCharge = this.calculateDailyCharge(studentCount);
    wallet.balance -= dailyCharge;

    await this.walletRepository.update(userId, {
      balance: wallet.balance,
      lastWithdrawalDate: new Date(),
    });

    this.logger.log(`Processed withdrawal for userId: ${userId}, deducted: ${dailyCharge}, new balance: ${wallet.balance}`);

    await this.evaluateWalletBalance(wallet, studentCount);
  }

  private async evaluateWalletBalance(wallet: Wallet, studentCount: number): Promise<void> {
    const { userId, balance } = wallet;
    const daysLeft = this.calculateDaysLeft(balance, studentCount);

    //TODO: Add messages to enum
    if (daysLeft <= 5) await this.sendNotification(userId, 'Low wallet balance', 'PUSH');
    if (daysLeft <= 2) await this.sendNotification(userId, 'Critically low wallet balance', 'SMS');
    if (daysLeft <= 0) await this.markWalletAsDepleted(wallet);
  }

  private async markWalletAsDepleted(wallet: Wallet): Promise<void> {
    await this.walletRepository.update(wallet.userId, { isWalletDepleted: true });
    await this.notifyWalletDepletion(wallet.userId, true);
    //TODO: Add message to enum
    await this.sendNotification(wallet.userId, 'Your wallet is depleted', 'SMS');
  }

  private async handleWalletRecovery(wallet: Wallet): Promise<void> {
    const studentCount = await this.getStudentCount(wallet.userId);
    const daysLeft = this.calculateDaysLeft(wallet.balance, studentCount);

    if (daysLeft >= 5) {
      await this.walletRepository.update(wallet.userId, { isWalletDepleted: false });
      await this.notifyWalletDepletion(wallet.userId, false);
    }
  }

  private shouldWithdraw(lastWithdrawalDate: Date): boolean {
    const diffInHours = (Date.now() - new Date(lastWithdrawalDate).getTime()) / (1000 * 60 * 60);
    return diffInHours >= 24;
  }

  private async getStudentCount(userId: number): Promise<number> {
    try {
      const result: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.GetCountStudentByOwner, { userId }).pipe(timeout(this.timeout)),
      );
      return result?.data?.count || 0;
    } catch (error) {
      this.logger.error(`Failed to fetch student count for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  private calculateDailyCharge(studentCount: number): number {
    return studentCount * this.DAILY_COST_PER_STUDENT;
  }

  private calculateDaysLeft(balance: number, studentCount: number): number {
    return balance / this.calculateDailyCharge(studentCount);
  }

  private async notifyWalletDepletion(userId: number, isDepleted: boolean) {
    try {
      await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.WalletDepletedClub, { userId, isWalletDepleted: isDepleted }).pipe(timeout(this.timeout)),
      );
    } catch (error) {
      this.logger.error(`Failed to notify club service about wallet depletion for user ${userId}: ${error.message}`);
    }
  }

  private async sendNotification(userId: number, message: string, type: string): Promise<void> {
    this.logger.log(`Sending notification to user ${userId}: ${message} [Type: ${type}]`);

    try {
      await lastValueFrom(
        this.notificationServiceClient
          .send(NotificationPatterns.CreateNotification, { type, message, recipients: [userId] })
          .pipe(timeout(this.timeout)),
      );
    } catch (error) {
      this.logger.error(`Failed to send notification to user ${userId}: ${error.message}`);
    }
  }

  private async notifySuperAdmin(message: string): Promise<void> {
    const superAdmin = await this.userRepository.findOneByRole(Role.SUPER_ADMIN);
    if (superAdmin) {
      await this.sendNotification(superAdmin.id, message, 'PUSH');
    }
  }
}
