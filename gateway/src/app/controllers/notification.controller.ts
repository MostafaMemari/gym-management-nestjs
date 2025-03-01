import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { NotificationPatterns } from '../../common/enums/notification.events';
import { lastValueFrom, timeout } from 'rxjs';

@Controller('notification')
@ApiTags('notification')
export class NotificationController {
  private readonly timeout = 5000

  constructor(@Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy) { }

  @Get('get-hello')
  async getMyNotification() {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient)

      const data = await lastValueFrom(this.notificationServiceClient.send(NotificationPatterns.getHello, {}).pipe(timeout(this.timeout)))

      return handleServiceResponse(data)
    } catch (error) {
      handleError(error, "Failed to get hello", Services.NOTIFICATION)
    }
  }
}
