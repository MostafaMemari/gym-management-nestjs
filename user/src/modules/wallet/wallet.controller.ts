import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WalletPatterns } from '../../common/enums/wallet.events';
import { IChargeWallet, IWithdrawWallet } from '../../common/interfaces/wallet.interface';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern(WalletPatterns.GetWallets)
  findAll() {
    return this.walletService.findAll();
  }

  @MessagePattern(WalletPatterns.GetOneWallet)
  findOne(@Payload() data: { walletId: number }) {
    return this.walletService.findOne(data);
  }

  @MessagePattern(WalletPatterns.GetWalletByUser)
  getWalletByUser(@Payload() data: { userId: number }) {
    return this.walletService.findOneByUser(data);
  }

  @MessagePattern(WalletPatterns.BlockWallet)
  block(@Payload() data: { walletId: number }) {
    return this.walletService.block(data);
  }

  @MessagePattern(WalletPatterns.UnblockWallet)
  unblock(@Payload() data: { walletId: number }) {
    return this.walletService.unblock(data);
  }

  @MessagePattern(WalletPatterns.ChargeWallet)
  charge(@Payload() data: IChargeWallet) {
    return this.walletService.charge(data);
  }

  @MessagePattern(WalletPatterns.WithdrawWallet)
  withdraw(@Payload() data: IWithdrawWallet) {
    return this.walletService.withdraw(data);
  }
}
