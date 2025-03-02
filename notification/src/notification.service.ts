import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { ICreateNotification } from './common/interfaces/notification.interface';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { NotificationMessages } from './common/enums/notification.messages';
import { ResponseUtil } from './common/utils/response.utils';
import { transformId } from './common/utils/transformId.utils';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) {}

  async create(createNotificationDto: ICreateNotification): Promise<ServiceResponse> {
    try {
      const newNotification = (await this.notificationModel.create(createNotificationDto)).toObject();

      const transformedNotification = transformId(newNotification, newNotification._id);

      return ResponseUtil.success({ notification: transformedNotification }, NotificationMessages.CreatedSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
