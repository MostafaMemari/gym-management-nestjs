import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { Model } from 'mongoose';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) notificationModel: Model<Notification>) { }

  getHello(): string {
    return 'Hello World From notification Service!';
  }
}
