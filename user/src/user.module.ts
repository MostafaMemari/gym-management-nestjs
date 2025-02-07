import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import envConfig from './configs/env.config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from './common/enums/services.enum';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    PrismaModule,
    ClientsModule.register([
      {
        name: Services.REDIS,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_REDIS_SERVICE_QUEUE
        }
      }
    ])
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule { }
