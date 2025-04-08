import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchemaFactory } from './notification.schema';
import { TelegramBotModule } from '../telegram-bot/telegram-bot.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MongooseModule.forFeatureAsync([
      {
        name: Notification.name,
        imports: [CacheModule],
        useFactory: (cacheService: CacheService) => NotificationSchemaFactory(cacheService),
        inject: [CacheService],
      },
    ]),
    CacheModule,
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_SERVICE_QUEUE,
        },
      },
    ]),
    //TelegramBotModule,
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
