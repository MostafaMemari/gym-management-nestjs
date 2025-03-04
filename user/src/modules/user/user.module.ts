import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import envConfig from '../../configs/env.config';
import { UserRepository } from './user.repository';
import { CacheModule } from '../cache/cache.module';
import { WalletModule } from '../wallet/wallet.module';

@Module({
  imports: [ConfigModule.forRoot(envConfig()), CacheModule, PrismaModule, WalletModule],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule {}
