import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';

@Module({
  imports: [ConfigModule.forRoot(envConfig())],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationModule {}
