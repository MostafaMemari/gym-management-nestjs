import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ICreateWallet } from '../../common/interfaces/wallet.interface';
import { WalletRepository } from './wallet.repository';
import { RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { WalletMessages } from '../../common/enums/wallet.messages';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) { }

  async create({ userId }: ICreateWallet): Promise<ServiceResponse> {
    try {
      const existingWallet = await this.walletRepository.findOneByUser(userId);

      if (existingWallet) {
        throw new ConflictException(WalletMessages.AlreadyExistsWallet);
      }

      const wallet = await this.walletRepository.create(userId);

      return ResponseUtil.success({ wallet }, WalletMessages.CreatedWalletSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(): Promise<ServiceResponse> {
    try {
      const wallets = await this.walletRepository.findAll();

      return ResponseUtil.success({ wallets }, "", HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async findOne({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet)
      if (wallet.isBlocked) throw new BadRequestException()

      return ResponseUtil.success({ wallet }, "", HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async block({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet)
      if (wallet.isBlocked) throw new BadRequestException(WalletMessages.AlreadyBlockedWallet)

      await this.walletRepository.block(walletId)

      return ResponseUtil.success({}, WalletMessages.BlockedWalletSuccess, HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async unblock({ walletId }: { walletId: number }) {
    try {
      const wallet = await this.walletRepository.findOne(walletId);

      if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet)

      await this.walletRepository.unblock(walletId)

      return ResponseUtil.success({}, WalletMessages.UnBlockedWalletSuccess, HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }
}
