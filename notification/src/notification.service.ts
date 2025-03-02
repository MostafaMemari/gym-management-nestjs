import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { ICreateNotification } from './common/interfaces/notification.interface';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { NotificationMessages } from './common/enums/notification.messages';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) { }

  async create(createNotificationDto: ICreateNotification): Promise<ServiceResponse> {
    try {

      const newNotification = (await this.notificationModel.create(createNotificationDto)).toObject()

      return {
        data: { notification: { ...newNotification, _id: undefined, id: newNotification._id } },
        error: false,
        message: NotificationMessages.CreatedSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
