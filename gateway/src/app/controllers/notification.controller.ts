import { BadRequestException, Body, Controller, Delete, Get, Inject, Param, Post, Put } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { NotificationPatterns } from '../../common/enums/notification.events';
import { lastValueFrom, timeout } from 'rxjs';
import { AuthDecorator } from '../../common/decorators/auth.decorator';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/auth-user-service/role.enum';
import { SwaggerConsumes } from '../../common/enums/swagger-consumes.enum';
import { CreateNotificationDto, UpdateNotificationDto } from '../../common/dtos/notification.dto';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { NotificationMessages } from '../../common/enums/shared.messages';

@Controller('notification')
@ApiTags('notification')
@AuthDecorator()
export class NotificationController {
  private readonly timeout = 5000;

  constructor(@Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async create(@Body() notificationDto: CreateNotificationDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const notificationData = { ...notificationDto, senderId: user.id };
      notificationData.recipients = notificationData.recipients.filter((item) => typeof item == 'number');

      if (notificationData.recipients.length > 100 && notificationData.type == 'SMS')
        throw new BadRequestException(NotificationMessages.MaximumRecipients);

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.CreateNotification, notificationData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create notification', Services.NOTIFICATION);
    }
  }

  @Get('user-notifications')
  async getUserNotifications(@GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.GetUserNOtifications, { userId: user.id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get notifications', Services.NOTIFICATION);
    }
  }

  @Get('sent')
  async getSentNotifications(@GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.GetSentNotifications, { senderId: user.id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get sent notifications', Services.NOTIFICATION);
    }
  }

  @Put('read/:id')
  async markAsRead(@Param('id') id: string, @GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const notificationData = { notificationId: id, userId: user.id };

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.MarkAsRead, notificationData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to mark as read notification', Services.NOTIFICATION);
    }
  }

  @Put(':id')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async update(@Param('id') id: string, @Body() updateNotificationDto: UpdateNotificationDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const notificationData = { notificationId: id, senderId: user.id, ...updateNotificationDto };
      notificationData.recipients = notificationData.recipients?.filter((item) => typeof item == 'number');

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.UpdateNotification, notificationData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to update notification', Services.NOTIFICATION);
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @GetUser() user: User) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const notificationData = { notificationId: id, senderId: user.id };

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.RemoveNotification, notificationData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove notification', Services.NOTIFICATION);
    }
  }
}
