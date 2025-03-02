import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { ICreateNotification } from './common/interfaces/notification.interface';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { NotificationMessages } from './common/enums/notification.messages';
import { ResponseUtil } from './common/utils/response.utils';
import { transformArrayIds, transformId } from './common/utils/transformId.utils';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) { }

  async create(createNotificationDto: ICreateNotification): Promise<ServiceResponse> {
    try {
      const newNotification = (await this.notificationModel.create(createNotificationDto)).toObject();

      const transformedNotification = transformId(newNotification);

      return ResponseUtil.success({ notification: transformedNotification }, NotificationMessages.CreatedSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getUserNotifications({ userId }: { userId: string }) {
    try {
      const notifications = await this.notificationModel.find({ recipients: { $in: userId } }, { recipients: 0, readBy: 0 }).sort({ createdAt: -1 }).lean()

      const transformedNotifications = transformArrayIds(notifications)

      return ResponseUtil.success({ notifications: transformedNotifications }, "", HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async getSentNotifications({ senderId }: { senderId: string }) {
    try {
      const notifications = await this.notificationModel.find({ senderId }).sort({ createdAt: -1 }).lean()

      const transformedNotifications = transformArrayIds(notifications)

      return ResponseUtil.success({ notifications: transformedNotifications }, "", HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }
}
