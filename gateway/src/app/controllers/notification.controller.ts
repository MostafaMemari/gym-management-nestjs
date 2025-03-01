import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';

@Controller('notification')
@ApiTags('notification')
export class NotificationController {
  constructor(@Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy) {}

  @Get('my-notification')
  getMyNotification() {
    return {
      data: { notification: 'hello sajad how are you?' },
    };
  }
}
