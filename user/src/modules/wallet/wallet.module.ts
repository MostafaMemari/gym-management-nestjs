import { forwardRef, Module } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { WalletRepository } from './wallet.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { ScheduleModule } from '@nestjs/schedule';
import { UserModule } from '../user/user.module';
import { UserRepository } from '../user/user.repository';
import { CacheService } from '../cache/cache.service';
import { RoleRepository } from '../role/role.repository';

@Module({
  imports: [ScheduleModule.forRoot(), forwardRef(() => UserModule)],
  controllers: [WalletController, PrismaModule],
  providers: [WalletService, WalletRepository, UserRepository, CacheService, RoleRepository],
})
export class WalletModule {}
