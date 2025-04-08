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

export interface IUpdateNotification {
  message?: string;
  recipients?: number[];
  notificationId: string;
  senderId: number;
}

export interface IPagination {
  take?: number;
  page?: number;
}

export interface INotificationFilter extends IPagination {
  senderId: number;
  recipients?: number[];
  message?: string;
  readBy?: number[];
  isEdited?: boolean;
  startDate?: Date;
  endDate?: Date;
  type?: NotificationType;
  sortBy?: 'createdAt' | 'updatedAt' | 'isEdited';
  sortDirection?: 'asc' | 'desc';
}
