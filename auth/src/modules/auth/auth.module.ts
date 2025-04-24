import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from '../../common/enums/services.enum';
import { JwtModule } from '@nestjs/jwt';
import { redisConfig } from '../../configs/redis.config';
import { RedisModule } from '@nestjs-modules/ioredis';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    JwtModule.register({ global: true }),
    RedisModule.forRoot(redisConfig()),
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_QUEUE_NAME,
        },
      },
      {
        name: Services.CLUB,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_CLUB_QUEUE_NAME,
        },
      },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [ClientsModule],
})
export class AuthModule {}
