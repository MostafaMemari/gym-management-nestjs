import { Logger, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './configs/env.config';
import { UserRepository } from './user.repository';
import { CacheModule } from '@nestjs/cache-manager'
import { cacheConfig } from './configs/cache.config';
import { LoggerModule, LoggerService } from 'nest-logger-plus'


@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    LoggerModule.forRoot({ logPath: `${process.cwd()}/logs` }),
    PrismaModule,
    CacheModule.register(cacheConfig()),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, LoggerService],
})
export class UserModule { }
