import { BadRequestException, HttpStatus, Inject, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification } from './notification.schema';
import { isValidObjectId, Model, ObjectId } from 'mongoose';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ICreateNotification, IMarkAsRead, IRemoveNotification, IUpdateNotification } from '../../common/interfaces/notification.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { NotificationMessages } from '../../common/enums/notification.messages';
import { ResponseUtil } from '../../common/utils/response.utils';
import { transformArrayIds, transformId } from '../../common/utils/transformId.utils';
import { RootFilterQuery } from 'mongoose';
import { NotificationType } from '../../common/enums/notification.type';
import { Smsir } from 'sms-typescript/lib';
import { Services } from '../../common/enums/services.enum';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { lastValueFrom, timeout } from 'rxjs';
import { UserPatterns } from '../../common/enums/user.events';

@Injectable()
export class NotificationService {
  private timeout: number = 4500;

  constructor(
    @InjectModel(Notification.name) private readonly notificationModel: Model<Notification>,
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
  ) {}

  async create(createNotificationDto: ICreateNotification): Promise<ServiceResponse> {
    try {
      if (createNotificationDto.type == NotificationType.SMS) return await this.sendViaSms(createNotificationDto);

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
        { $match: { recipients: userId, type: NotificationType.PUSH } },
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

      this.validateObjectId(notificationId);

      const existingNotification = await this.findOneOrFail(notificationId, { recipients: userId });

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

      this.validateObjectId(notificationId);

      const notification = await this.findOneOrFail(notificationId, { senderId, type: NotificationType.PUSH });

      const transformedId = transformId(notification);

      return ResponseUtil.success({ notification: transformedId }, NotificationMessages.RemovedSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(notificationDto: IUpdateNotification) {
    try {
      const { message, recipients, notificationId, senderId } = notificationDto;

      this.validateObjectId(notificationId);

      await this.findOneOrFail(notificationId, { type: NotificationType.PUSH });

      const notification = await this.notificationModel
        .findOneAndUpdate(
          { _id: notificationId, senderId },
          {
            message,
            recipients,
            isEdited: true,
            readBy: [],
          },
          {
            new: true,
          },
        )
        .lean();

      const transformedId = transformId(notification);

      return ResponseUtil.success({ notification: transformedId }, NotificationMessages.UpdatedSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async sendViaSms(notificationDto: ICreateNotification): Promise<ServiceResponse> {
    const { SMS_API_KEY, SMS_LINE_NUMBER } = process.env;

    const sms = new Smsir(SMS_API_KEY, Number(SMS_LINE_NUMBER));

    const users = await this.getUsersByIds(notificationDto.recipients);

    const mobiles = users.map((user) => user.mobile);

    const result = await sms.SendBulk(notificationDto.message, mobiles);

    if (result.data.status !== 1) throw new InternalServerErrorException(NotificationMessages.ProblemSendingSms);

    const notification = await this.notificationModel.create(notificationDto);

    const transformedId = transformId(notification.toObject());

    return ResponseUtil.success({ notification: transformedId }, NotificationMessages.NotificationSmsSentSuccess, HttpStatus.OK);
  }

  private async getUsersByIds(usersIds: number[]) {
    await checkConnection(Services.USER, this.userServiceClient);

    const resultUsers: ServiceResponse = await lastValueFrom(
      this.userServiceClient.send(UserPatterns.GetUsersByIds, { usersIds }).pipe(timeout(this.timeout)),
    );

    if (resultUsers.error) throw resultUsers;

    if (!resultUsers.data.users) throw new InternalServerErrorException();

    return resultUsers.data.users;
  }

  private async findOneOrFail(id: ObjectId | string, filters: RootFilterQuery<Notification> = {}): Promise<Notification | never> {
    const notification = await this.notificationModel.findOne({ _id: id, ...filters }).lean();

    if (!notification) throw new NotFoundException(NotificationMessages.NotFoundNotification);

    return notification;
  }

  private validateObjectId(objectId: ObjectId | string): void | never {
    if (!isValidObjectId(objectId)) throw new BadRequestException(NotificationMessages.InvalidObjectId);
  }
}
