import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { NotificationPatterns } from '../../common/enums/notification.events';
import { lastValueFrom, timeout } from 'rxjs';
import { AuthDecorator } from '../../common/decorators/auth.decorator';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/role.enum';
import { SwaggerConsumes } from '../../common/enums/swagger-consumes.enum';
import { CreateNotificationDto } from '../../common/dtos/notification.dto';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller('notification')
@ApiTags('notification')
@AuthDecorator()
export class NotificationController {
  private readonly timeout = 5000;

  constructor(@Inject(Services.NOTIFICATION) private readonly notificationServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async create(@Body() notificationDto: CreateNotificationDto) {
    try {
      await checkConnection(Services.NOTIFICATION, this.notificationServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.notificationServiceClient.send(NotificationPatterns.CreateNotification, notificationDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create notification', Services.NOTIFICATION);
    }
  }
}
