import { Controller } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PermissionPatterns } from '../../common/enums/permission.events';
import { ICreatePermission, IPermissionFilter, IUpdatePermission } from '../../common/interfaces/permission.interface';

@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) {}

  @MessagePattern(PermissionPatterns.CreatePermission)
  create(@Payload() data: ICreatePermission) {
    return this.permissionService.create(data);
  }

  @MessagePattern(PermissionPatterns.GetOnePermission)
  getOne(@Payload() data: { permissionId: number }) {
    return this.permissionService.findOne(data);
  }

  @MessagePattern(PermissionPatterns.GetPermissions)
  getAll(@Payload() data: IPermissionFilter) {
    return this.permissionService.findAll(data);
  }

  @MessagePattern(PermissionPatterns.UpdatePermission)
  update(@Payload() data: IUpdatePermission) {
    return this.permissionService.update(data);
  }
}
