import { NotificationType } from '../enums/notification.type';

export interface ICreateNotification {
  message: string;
  recipients?: number[] | null;
  type?: NotificationType;
  senderId?: number;
}

export interface IMarkAsRead {
  userId: number;
  notificationId: string;
}

export interface IRemoveNotification {
  senderId: number;
  notificationId: string;
}
