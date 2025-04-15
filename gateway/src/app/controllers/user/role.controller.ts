import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Services } from '../../../common/enums/services.enum';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { RolePatterns } from '../../../common/enums/role.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { staticRoles } from '../../../common/constants/permissions.constant';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { SkipAuth } from '../../../common/decorators/skip-auth.decorator';
import { CreateRoleDto } from '../../../common/dtos/user-service/role.dto';

@Controller('role')
@ApiTags('role')
@AuthDecorator()
export class RoleController {
  private readonly timeout: number = 5000;

  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) {}

  @Get('sync')
  @SkipAuth()
  async syncStaticRoles() {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.SyncStaticRoles, { staticRoles }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      console.log(error);
      handleError(error, 'Failed to sync static roles', Services.USER);
    }
  }

  @Post()
  @SkipAuth()
  async create(@Body() createRoleDto: CreateRoleDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.CreateRole, createRoleDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to create role', Services.USER);
    }
  }
}
