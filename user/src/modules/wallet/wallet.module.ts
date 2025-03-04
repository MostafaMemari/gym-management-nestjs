import { Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletRepository } from './wallet.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  controllers: [WalletController, PrismaModule],
  providers: [WalletService, WalletRepository],
})
export class WalletModule {}
