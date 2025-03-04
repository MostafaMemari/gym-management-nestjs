import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { ICreateWallet } from '../../common/interfaces/wallet.interface';
import { WalletRepository } from './wallet.repository';
import { RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { WalletMessages } from '../../common/enums/wallet.messages';

@Injectable()
export class WalletService {
  constructor(private readonly walletRepository: WalletRepository) {}

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

  findAll() {
    return `This action returns all wallet`;
  }

  findOne(id: number) {
    return `This action returns a #${id} wallet`;
  }

  update(id: number, updateWalletDto: any) {
    return `This action updates a #${id} wallet`;
  }

  remove(id: number) {
    return `This action removes a #${id} wallet`;
  }
}
