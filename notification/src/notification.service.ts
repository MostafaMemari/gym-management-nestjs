import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) {}

  async getHello() {
    try {
      const notif = await this.notificationModel.find();

      console.log('notif =>', notif);

      return 'Hello World From notification Service!';
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
