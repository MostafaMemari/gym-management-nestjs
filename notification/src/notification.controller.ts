import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern } from '@nestjs/microservices';
import { NotificationPatterns } from './common/enums/notification.events';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NotificationPatterns.getHello)
  getHello(): string {
    return this.notificationService.getHello();
  }

  @MessagePattern(NotificationPatterns.checkConnection)
  checkConnection() {
    return true;
  }
}
