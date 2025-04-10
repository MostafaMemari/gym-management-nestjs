import { Controller } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { NotificationPatterns } from '../../common/enums/notification.events';
import {
  ICreateNotification,
  IMarkAsRead,
  INotificationFilter,
  IRemoveNotification,
  IUpdateNotification,
  IUserNotificationFilter,
} from '../../common/interfaces/notification.interface';

@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @MessagePattern(NotificationPatterns.CreateNotification)
  create(@Payload() data: ICreateNotification) {
    return this.notificationService.create(data);
  }

  @MessagePattern(NotificationPatterns.GetUserNotification)
  getUserNotifications(@Payload() data: IUserNotificationFilter) {
    return this.notificationService.getUserNotifications(data);
  }

  @MessagePattern(NotificationPatterns.GetSentNotification)
  getSentNotifications(@Payload() data: INotificationFilter) {
    return this.notificationService.getSentNotifications(data);
  }

  @MessagePattern(NotificationPatterns.MarkAsRead)
  markAsRead(@Payload() data: IMarkAsRead) {
    return this.notificationService.markAsRead(data);
  }

  @MessagePattern(NotificationPatterns.RemoveNotification)
  remove(@Payload() data: IRemoveNotification) {
    return this.notificationService.remove(data);
  }

  @MessagePattern(NotificationPatterns.UpdateNotification)
  update(@Payload() data: IUpdateNotification) {
    return this.notificationService.update(data);
  }

  @MessagePattern(NotificationPatterns.CheckConnection)
  checkConnection() {
    return true;
  }
}
