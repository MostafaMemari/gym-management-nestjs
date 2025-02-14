import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './configs/env.config';
import { UserRepository } from './user.repository';
import { CacheModule } from '@nestjs/cache-manager'
import { cacheConfig } from './configs/cache.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    PrismaModule,
    CacheModule.registerAsync(cacheConfig()),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
})
export class UserModule { }
