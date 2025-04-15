import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Services } from '../../../common/enums/services.enum';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { RolePatterns } from '../../../common/enums/role.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { staticRoles } from '../../../common/constants/permissions.constant';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { SkipAuth } from '../../../common/decorators/skip-auth.decorator';
import { CreateRoleDto, QueryRolesDto } from '../../../common/dtos/user-service/role.dto';
import { SwaggerConsumes } from 'src/common/enums/swagger-consumes.enum';

@Controller('role')
@ApiTags('role')
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

  @Get(':id')
  async getOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.GetOneRole, { roleId: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to find a role', Services.USER);
    }
  }

  @Get()
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async getAll(@Query() rolesFilters: QueryRolesDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.GetRoles, rolesFilters).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to get roles', Services.USER);
    }
  }
}
