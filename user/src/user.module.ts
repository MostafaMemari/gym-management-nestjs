import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './configs/env.config';
import { UserRepository } from './user.repository';
import { LoggerModule, LoggerService } from 'nest-logger-plus'
import { CacheModule } from './cache/cache.module';


@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    LoggerModule.forRoot({ logPath: `${process.cwd()}/logs` }),
    CacheModule,
    PrismaModule,
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository, LoggerService],
})
export class UserModule { }
