import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WalletPatterns } from '../../common/enums/wallet.events';
import { ICreateWallet } from '../../common/interfaces/wallet.interface';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern(WalletPatterns.CreateWallet)
  create(@Payload() data: ICreateWallet) {
    return this.walletService.create(data);
  }

  @MessagePattern(WalletPatterns.GetWallets)
  findAll() {
    return this.walletService.findAll();
  }

  @MessagePattern(WalletPatterns.GetOneWallet)
  findOne(@Payload() data: { walletId: number }) {
    return this.walletService.findOne(data);
  }
}
