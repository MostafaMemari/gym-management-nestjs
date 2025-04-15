import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Services } from '../../../common/enums/services.enum';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { PermissionPatterns } from '../../../common/enums/permission.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('permission')
@ApiTags('permission')
export class PermissionController {
  private readonly timeout: number = 5000;

  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) {}
}
