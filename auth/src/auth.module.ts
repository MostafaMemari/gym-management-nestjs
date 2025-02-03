import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from './enums/services.enum';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    JwtModule.register({ global: true }),
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_QUEUE_NAME,
        }
      },
      {
        name: Services.REDIS,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_REDIS_QUEUE_NAME,
        }
      }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService,],
})
export class AuthModule { }
