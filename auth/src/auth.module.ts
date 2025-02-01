import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig())
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
