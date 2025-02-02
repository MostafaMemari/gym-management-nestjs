import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './configs/env.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    PrismaModule
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
