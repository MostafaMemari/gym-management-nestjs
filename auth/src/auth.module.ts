import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from './enums/services.enum';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_QUEUE_NAME,
        }
      }
    ])
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
