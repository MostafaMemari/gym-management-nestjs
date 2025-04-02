import { BadRequestException, HttpStatus, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  IChargeWallet,
  IManualCredit,
  IWalletDeductionFilter,
  IWalletManualCreditFilter,
  IWalletsFilter,
} from '../../common/interfaces/wallet.interface';
import { WalletRepository } from './wallet.repository';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { WalletMessages } from '../../common/enums/wallet.messages';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Services } from '../../common/enums/services.enum';
import { lastValueFrom, timeout } from 'rxjs';
import { ClubPatterns } from '../../common/enums/club.events';
import { NotificationPatterns } from '../../common/enums/notification.events';
import { UserRepository } from '../user/user.repository';
import { ManualCredit, Prisma, Role, Wallet, WalletDeduction, WalletStatus } from '@prisma/client';
import { CacheKeys } from '../../common/enums/cache.enum';
import { CacheService } from '../cache/cache.service';
import { pagination } from '../../common/utils/pagination.utils';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);
  private readonly timeout = 4500;
  private readonly DAILY_COST_PER_STUDENT = Number.parseInt(process.env.DAILY_COST_PER_STUDENT);
  private readonly REDIS_EXPIRE_TIME = 600; //* Seconds

  constructor(
    private readonly walletRepository: WalletRepository,
    private readonly userRepository: UserRepository,
    @Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy,
    @Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy,
    private readonly cache: CacheService,
  ) {}

  async findAll({ take, page, ...walletFilters }: IWalletsFilter): Promise<ServiceResponse> {
    try {
      const paginationDto = { take, page };
      const { endDate, isBlocked, lastWithdrawalDate, maxBalance, minBalance, sortBy, sortDirection, startDate, status, userId } = walletFilters;

      const sortedDto = Object.keys(walletFilters)
        .sort()
        .reduce((obj, key) => ({ ...obj, [key]: walletFilters[key] }), {});

      const cacheKey = `${CacheKeys.Wallets}_${JSON.stringify(sortedDto)}`;

      const walletsCache = await this.cache.get<null | Wallet[]>(cacheKey);

      if (walletsCache) return ResponseUtil.success({ ...pagination(paginationDto, walletsCache) }, '', HttpStatus.OK);

      const filters: Partial<Prisma.WalletWhereInput> = {};

      if (userId) filters.userId = userId;
      if (isBlocked) filters.isBlocked = isBlocked;
      if (lastWithdrawalDate) filters.lastWithdrawalDate;
      if (status) filters.status = status;
      if (minBalance || maxBalance) {
        filters.balance = {};
        if (minBalance) filters.balance.gte = minBalance;
        if (maxBalance) filters.balance.lte = maxBalance;
      }
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const wallets = await this.walletRepository.findAll({
        where: filters,
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
      });

      await this.cache.set(cacheKey, wallets, this.REDIS_EXPIRE_TIME);

      return ResponseUtil.success({ ...pagination(paginationDto, wallets) }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

      return ResponseUtil.success({ wallet }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOneByUser({ userId }: { userId: number }) {
    try {
      const wallet = await this.walletRepository.findOneByUser(userId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

      if (wallet.isBlocked) throw new BadRequestException(WalletMessages.BlockedWallet);

      return ResponseUtil.success({ wallet }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAllDeductions({ page, take, ...deductionFilters }: IWalletDeductionFilter) {
    try {
      const paginationDto = { take, page };
      const { endDate, maxAmount, minAmount, sortBy, sortDirection, startDate, userId, walletId } = deductionFilters;

      const sortedDto = Object.keys(deductionFilters)
        .sort()
        .reduce((obj, key) => ({ ...obj, [key]: deductionFilters[key] }), {});

      const cacheKey = `${CacheKeys.WalletDeduction}_${JSON.stringify(sortedDto)}`;

      const deductionsWalletsCache = await this.cache.get<null | WalletDeduction[]>(cacheKey);

      if (deductionsWalletsCache) return ResponseUtil.success({ ...pagination(paginationDto, deductionsWalletsCache) }, '', HttpStatus.OK);

      const filters: Partial<Prisma.WalletDeductionWhereInput> = {};

      if (walletId) filters.walletId = walletId;
      if (userId) filters.userId = userId;
      if (minAmount || maxAmount) {
        filters.deductionAmount = {};
        if (minAmount) filters.deductionAmount.gte = minAmount;
        if (maxAmount) filters.deductionAmount.lte = maxAmount;
      }
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const deductionWallets = await this.walletRepository.findAllDeductions({
        where: filters,
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
      });

      await this.cache.set(cacheKey, deductionWallets, this.REDIS_EXPIRE_TIME);

      return ResponseUtil.success({ ...pagination(paginationDto, deductionWallets) }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAllManualCredits({ take, page, ...manualCreditFilters }: IWalletManualCreditFilter) {
    try {
      const paginationDto = { take, page };
      const { creditedBy, endDate, maxAmount, minAmount, reason, sortBy, sortDirection, startDate, userId, walletId } = manualCreditFilters;

      const sortedDto = Object.keys(manualCreditFilters)
        .sort()
        .reduce((obj, key) => ({ ...obj, [key]: manualCreditFilters[key] }), {});

      const cacheKey = `${CacheKeys.ManualCredit}_${JSON.stringify(sortedDto)}`;

      const manualCreditsCache = await this.cache.get<null | ManualCredit[]>(cacheKey);

      if (manualCreditsCache) return ResponseUtil.success({ ...pagination(paginationDto, manualCreditsCache) }, '', HttpStatus.OK);

      const filters: Partial<Prisma.ManualCreditWhereInput> = {};

      if (walletId) filters.walletId = walletId;
      if (userId) filters.userId = userId;
      if (creditedBy) filters.creditedBy = creditedBy;
      if (reason) filters.reason = { contains: reason, mode: 'insensitive' };
      if (minAmount || maxAmount) {
        filters.amount = {};
        if (minAmount) filters.amount.gte = minAmount;
        if (maxAmount) filters.amount.lte = maxAmount;
      }
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const manualCredits = await this.walletRepository.findAllManualCredits({
        where: filters,
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
      });

      await this.cache.set(cacheKey, manualCredits, this.REDIS_EXPIRE_TIME);

      return ResponseUtil.success({ ...pagination(paginationDto, manualCredits) }, '', HttpStatus.OK);
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

      if (amount <= 0) throw new BadRequestException(WalletMessages.AmountMustBeGreaterThanZero);

      let wallet = await this.walletRepository.findOneByUser(userId);

      if (wallet?.isBlocked) throw new BadRequestException(WalletMessages.BlockedWallet);

      if (!wallet) wallet = await this.walletRepository.create({ userId, lastWithdrawalDate: new Date() });

      wallet.balance += amount;
      await this.walletRepository.update(userId, { balance: wallet.balance });

      await this.tryToRecoveryWallet(wallet);

      return ResponseUtil.success({ wallet }, WalletMessages.ChargedWalletSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async manualCredit(manualCreditDto: IManualCredit) {
    try {
      const { amount, creditedBy, reason, walletId } = manualCreditDto;
      const wallet = await this.findOneByIdAndThrow(walletId);

      const user = await this.userRepository.findByIdAndThrow(creditedBy);

      await this.chargeWallet({ amount, userId: wallet.userId });

      const manualCredit = await this.walletRepository.cerateManualCredit({ amount, creditedBy, reason, userId: user.id, walletId });

      const notificationMessage = WalletMessages.CreditNotification.replace('${amount}', amount.toString()).replace('${reason}', reason);

      await this.sendNotification(user.id, notificationMessage, 'PUSH');

      return ResponseUtil.success({ manualCredit }, WalletMessages.ManualCreditSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async findOneByIdAndThrow(walletId: number): Promise<Wallet | never> {
    const wallet = await this.walletRepository.findOne(walletId);

    if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

    return wallet;
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async processHourlyWithdraw(): Promise<void> {
    this.logger.log('Starting hourly withdrawal process...');

    try {
      const wallets = await this.walletRepository.findAll({ where: { isBlocked: false, status: { not: WalletStatus.DEPLETED } } });

      this.logger.log(`Found ${wallets.length} active wallets for processing.`);

      for (const wallet of wallets) {
        if (!this.shouldWithdraw(wallet.lastWithdrawalDate)) continue;

        await this.withdrawHourlyCharge(wallet);
      }

      this.logger.log('Hourly withdrawal process completed successfully.');
    } catch (error) {
      this.logger.error(`Failed to process withdraw: ${error.message}`, error.stack);
      await this.notifySuperAdmin(WalletMessages.HourlyWithdrawalFailed);
    }
  }

  private async withdrawHourlyCharge(wallet: Wallet): Promise<void> {
    const { userId } = wallet;
    const studentCount = await this.getStudentCount(userId);
    if (studentCount === 0) return;

    const hourlyCharge = this.calculateHourlyCharge(studentCount);

    wallet.balance -= hourlyCharge;
    if (wallet.balance < 0) wallet.balance = 0;

    await this.walletRepository.update(userId, {
      balance: wallet.balance,
      lastWithdrawalDate: new Date(),
    });

    await this.walletRepository.createDeduction({
      userId: userId,
      walletId: wallet.id,
      deductionAmount: hourlyCharge,
      remainingBalance: wallet.balance,
    });

    this.logger.log(`Processed withdrawal for userId: ${userId}, deducted: ${hourlyCharge}, new balance: ${wallet.balance}`);

    await this.evaluateWalletBalance(wallet, studentCount);

    if (wallet.balance < hourlyCharge * 2) {
      this.logger.log(`User ${userId} does not have enough balance. Skipping deduction.`);
      await this.walletRepository.update(userId, { status: WalletStatus.DEPLETED });
      return;
    }
  }

  private async evaluateWalletBalance(wallet: Wallet, studentCount: number): Promise<void> {
    const { userId, balance, status } = wallet;
    const hoursLeft = this.calculateHoursLeft(balance, studentCount);

    if (hoursLeft === 0 && status !== WalletStatus.DEPLETED) return await this.markWalletAsDepleted(wallet);

    if (hoursLeft > 0 && hoursLeft <= 24 && status !== WalletStatus.CRITICAL_BALANCE) {
      await this.changeWalletStatus(wallet.id, WalletStatus.CRITICAL_BALANCE);
      return this.sendNotification(userId, WalletMessages.CriticallyLowWalletBalance, 'SMS');
    }

    if (hoursLeft > 24 && hoursLeft <= 48 && status !== WalletStatus.LOW_BALANCE) {
      await this.changeWalletStatus(wallet.id, WalletStatus.LOW_BALANCE);
      return await this.sendNotification(userId, WalletMessages.LoWalletBalance, 'PUSH');
    }

    if (hoursLeft > 48 && status !== WalletStatus.NONE) await this.changeWalletStatus(wallet.id, WalletStatus.NONE);
  }

  async changeWalletStatus(walletId: number, status: WalletStatus): Promise<void | never> {
    const updatedWallet = await this.walletRepository.update(walletId, { status });

    if (status !== WalletStatus.DEPLETED) return await this.notifyWalletDepletion(updatedWallet.userId, false);

    await this.notifyWalletDepletion(updatedWallet.userId, true);
  }

  private async markWalletAsDepleted(wallet: Wallet): Promise<void> {
    await this.walletRepository.update(wallet.userId, { status: WalletStatus.DEPLETED });
    await this.notifyWalletDepletion(wallet.userId, true);

    await this.sendNotification(wallet.userId, WalletMessages.DepletedWallet, 'SMS');
  }

  private async tryToRecoveryWallet(wallet: Wallet): Promise<void> {
    const studentCount = await this.getStudentCount(wallet.userId);
    await this.evaluateWalletBalance(wallet, studentCount);

    const checkWallet = await this.walletRepository.findOne(wallet.id);

    if (checkWallet.status == WalletStatus.DEPLETED) return;

    if (checkWallet && !this.shouldWithdraw(wallet.lastWithdrawalDate)) return;

    await this.withdrawHourlyCharge(wallet);
  }

  private shouldWithdraw(lastWithdrawalDate: Date): boolean {
    const diffInHours = Math.abs(+((Date.now() - new Date(lastWithdrawalDate.toISOString()).getTime()) / (1000 * 60 * 60)).toFixed());
    return diffInHours >= 1;
  }

  private async getStudentCount(userId: number): Promise<number> {
    try {
      const result: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.GetCountStudentByOwner, { userId }).pipe(timeout(this.timeout)),
      );

      if (result.error) {
        this.logger.error(`Error fetching student count for userId: ${userId}. Error message: ${result.message}`);
        return 0;
      }

      //TODO: Remove make student count
      result.data.count = 300;
      return result?.data?.count || 0;
    } catch (error) {
      this.logger.error(`Failed to fetch student count for user ${userId}: ${error.message}`);
      return 0;
    }
  }

  private calculateHourlyCharge(studentCount: number): number {
    const HOURLY_COST_PER_STUDENT = this.DAILY_COST_PER_STUDENT / 24;
    return studentCount * HOURLY_COST_PER_STUDENT;
  }

  private calculateHoursLeft(balance: number, studentCount: number): number {
    return +(balance / this.calculateHourlyCharge(studentCount)).toFixed(0);
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
