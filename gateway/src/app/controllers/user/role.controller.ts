import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
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
import {
  AssignPermissionDto,
  AssignRoleDto,
  CreateRoleDto,
  QueryPermissionDto,
  QueryRolesDto,
  UnassignPermissionDto,
  UnassignRoleDto,
  UpdateRoleDto,
} from '../../../common/dtos/user-service/role.dto';
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

  @Get('permissions')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async getAllPermissions(@Query() permissionsFilters: QueryPermissionDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.GetPermissions, permissionsFilters).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to get permissions', Services.USER);
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

  @Get('permission/:id')
  async getOnePermission(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.GetOnePermission, { permissionId: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to get a permission', Services.USER);
    }
  }

  @Put('assign-permission')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async assignPermission(@Body() assignPermissionDto: AssignPermissionDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.AssignPermissionToRole, assignPermissionDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to assign permission', Services.USER);
    }
  }

  @Put('assign-role')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async assignRoleToUser(@Body() assignRoleDto: AssignRoleDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.AssignRoleToUser, assignRoleDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to assign role to user', Services.USER);
    }
  }

  @Put('unassign-role')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async unassignRole(@Body() unassignRoleDto: UnassignRoleDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.RemoveRoleFromUser, unassignRoleDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to unassign role', Services.USER);
    }
  }

  @Put('unassign-permission')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async unassignPermission(@Body() unassignPermissionDto: UnassignPermissionDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.RemovedPermissionFromRole, unassignPermissionDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to unassign permission', Services.USER);
    }
  }

  @Put(':id')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateRoleDto: UpdateRoleDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.UpdateRole, { roleId: id, ...updateRoleDto }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to update role', Services.USER);
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(RolePatterns.RemoveRole, { roleId: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to remove role', Services.USER);
    }
  }
}
