import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { isValidObjectId, Model } from 'mongoose';
import { RpcException } from '@nestjs/microservices';
import { ICreateNotification, IMarkAsRead, IRemoveNotification, IUpdateNotification } from '../../common/interfaces/notification.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { NotificationMessages } from '../../common/enums/notification.messages';
import { ResponseUtil } from '../../common/utils/response.utils';
import { transformArrayIds, transformId } from '../../common/utils/transformId.utils';

@Injectable()
export class NotificationService {
  constructor(@InjectModel(Notification.name) private readonly notificationModel: Model<Notification>) {}

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
      const notifications = await this.notificationModel.aggregate([
        { $match: { recipients: userId } },
        { $sort: { createdAt: -1 } },
        {
          $project: {
            _id: 1,
            message: 1,
            createdAt: 1,
            updatedAt: 1,
            senderId: 1,
            type: 1,
            isRead: { $in: [userId, '$readBy'] },
          },
        },
      ]);

      const transformedNotifications = transformArrayIds(notifications);

      return ResponseUtil.success({ notifications: transformedNotifications }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async getSentNotifications({ senderId }: { senderId: string }) {
    try {
      const notifications = await this.notificationModel.find({ senderId }).sort({ createdAt: -1 }).lean();

      const transformedNotifications = transformArrayIds(notifications);

      return ResponseUtil.success({ notifications: transformedNotifications }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async markAsRead(notificationDto: IMarkAsRead) {
    try {
      const { notificationId, userId } = notificationDto;

      if (!isValidObjectId(notificationId)) throw new BadRequestException(NotificationMessages.InvalidObjectId);

      const existingNotification = await this.notificationModel.findOne({ _id: notificationId, recipients: userId });

      if (!existingNotification) {
        throw new NotFoundException(NotificationMessages.NotFoundNotification);
      }

      if (existingNotification.readBy.includes(userId)) throw new BadRequestException(NotificationMessages.AlreadyMarkAsReadNotification);

      const notification = await this.notificationModel
        .findOneAndUpdate(
          { _id: notificationId, recipients: userId },
          {
            $addToSet: { readBy: userId },
          },
          {
            new: true,
          },
        )
        .select('-readBy -recipients')
        .lean();

      const transformedNotification = transformId(notification);

      return ResponseUtil.success({ notification: transformedNotification }, NotificationMessages.MarkAsReadSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async remove(notificationDto: IRemoveNotification) {
    try {
      const { notificationId, senderId } = notificationDto;

      if (!isValidObjectId(notificationId)) throw new BadRequestException(NotificationMessages.InvalidObjectId);

      const notification = await this.notificationModel.findOneAndDelete({ _id: notificationId, senderId }).lean();

      if (!notification) throw new NotFoundException(NotificationMessages.NotFoundNotification);

      const transformedId = transformId(notification);

      return ResponseUtil.success({ notification: transformedId }, NotificationMessages.RemovedSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(notificationDto: IUpdateNotification) {
    try {
      const { message, recipients, notificationId, senderId } = notificationDto;

      if (!isValidObjectId(notificationId)) throw new BadRequestException(NotificationMessages.InvalidObjectId);

      const notification = await this.notificationModel
        .findOneAndUpdate(
          { _id: notificationId, senderId },
          {
            message,
            recipients,
            isEdited: true,
            $pull: { readBy: { $nin: recipients } },
          },
          {
            new: true,
          },
        )
        .lean();

      if (!notification) throw new NotFoundException(NotificationMessages.NotFoundNotification);

      const transformedId = transformId(notification);

      return ResponseUtil.success({ notification: transformedId }, NotificationMessages.UpdatedSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
