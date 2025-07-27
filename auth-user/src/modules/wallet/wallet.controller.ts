import { Controller } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { WalletPatterns } from '../../common/enums/wallet.events';
import { IChargeWallet, IManualCredit, IWalletDeductionFilter, IWalletManualCreditFilter } from '../../common/interfaces/wallet.interface';
import { IPagination } from '../../common/interfaces/user.interface';

@Controller()
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @MessagePattern(WalletPatterns.GetWallets)
  findAll(@Payload() data: IPagination) {
    return this.walletService.findAll(data);
  }

  @MessagePattern(WalletPatterns.GetOneWallet)
  findOne(@Payload() data: { walletId: number }) {
    return this.walletService.findOne(data);
  }

  @MessagePattern(WalletPatterns.GetWalletByUser)
  getWalletByUser(@Payload() data: { userId: number }) {
    return this.walletService.findOneByUser(data);
  }

  @MessagePattern(WalletPatterns.GetWalletsDeductions)
  getWalletsDeductions(@Payload() data: IWalletDeductionFilter) {
    return this.walletService.findAllDeductions(data);
  }

  @MessagePattern(WalletPatterns.GetWalletsManualCredits)
  getWalletsManualCredits(@Payload() data: IWalletManualCreditFilter) {
    return this.walletService.findAllManualCredits(data);
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
    return this.walletService.chargeWallet(data);
  }

  @MessagePattern(WalletPatterns.ManualCreditWallet)
  manualCredit(@Payload() data: IManualCredit) {
    return this.walletService.manualCredit(data);
  }
}
