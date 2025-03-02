import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationPatterns } from './common/enums/notification.events';
import { ICreateNotification } from './common/interfaces/notification.interface';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) { }

  @MessagePattern(NotificationPatterns.CreateNotification)
  create(@Payload() data: ICreateNotification) {
    return this.notificationService.create(data);
  }

  @MessagePattern(NotificationPatterns.checkConnection)
  checkConnection() {
    return true;
  }
}
