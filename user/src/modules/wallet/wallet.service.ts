import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { IChargeWallet, IWithdrawWallet } from '../../common/interfaces/wallet.interface';
import { WalletRepository } from './wallet.repository';
import { RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { WalletMessages } from '../../common/enums/wallet.messages';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

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

  async charge(chargeDto: IChargeWallet): Promise<ServiceResponse> {
    try {
      const { amount, userId } = chargeDto;

      //TODO: Add message
      if (amount <= 0) throw new BadRequestException();

      let wallet = await this.walletRepository.findOneByUser(userId);

      if (!wallet) wallet = await this.walletRepository.create({ userId });

      wallet = await this.walletRepository.update(userId, { balance: (wallet.balance += amount) });

      return ResponseUtil.success({ wallet }, WalletMessages.ChargedWalletSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async withdraw(withdrawDto: IWithdrawWallet): Promise<ServiceResponse> {
    try {
      const wallet = await this.walletRepository.findOneByUser(withdrawDto.userId);
      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

      //TODO: Add message
      if (wallet.isBlocked) throw new BadRequestException();
      if (wallet.balance < withdrawDto.amount) throw new BadRequestException();

      const updatedWallet = await this.walletRepository.update(withdrawDto.userId, { balance: wallet.balance - withdrawDto.amount });

      //TODO: Add message
      return ResponseUtil.success({ wallet: updatedWallet }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
