import { Controller } from '@nestjs/common';
import { RoleService } from './role.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolePatterns } from '../../common/enums/role.events';
import {
  IAssignPermission,
  IAssignRoleToUser,
  ICreateRole,
  IPermissionFilter,
  IRemovePermissionFromRole,
  IRemoveRoleFromUser,
  IRolesFilter,
  IStaticRoles,
  IUpdateRole,
} from '../../common/interfaces/role.interface';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern(RolePatterns.CreateRole)
  create(@Payload() data: ICreateRole) {
    return this.roleService.create(data);
  }

  @MessagePattern(RolePatterns.SyncStaticRoles)
  syncStaticRoles(@Payload() data: IStaticRoles) {
    return this.roleService.syncStaticRoles(data);
  }

  @MessagePattern(RolePatterns.GetOneRole)
  getOne(@Payload() data: { roleId: number }) {
    return this.roleService.findOne(data);
  }

  @MessagePattern(RolePatterns.AssignPermissionToRole)
  assignPermissionToRole(@Payload() data: IAssignPermission) {
    return this.roleService.assignPermission(data);
  }

  @MessagePattern(RolePatterns.AssignRoleToUser)
  assignRoleToUser(@Payload() data: IAssignRoleToUser) {
    return this.roleService.assignRoleToUser(data);
  }

  @MessagePattern(RolePatterns.GetRoles)
  getAll(@Payload() data: IRolesFilter) {
    return this.roleService.findAll(data);
  }

  @MessagePattern(RolePatterns.GetOnePermission)
  getOnePermission(@Payload() data: { permissionId: number }) {
    return this.roleService.findOnePermission(data);
  }

  @MessagePattern(RolePatterns.GetPermissions)
  getAllPermissions(@Payload() data: IPermissionFilter) {
    return this.roleService.findAllPermissions(data);
  }

  @MessagePattern(RolePatterns.RemoveRole)
  remove(@Payload() data: { roleId: number }) {
    return this.roleService.remove(data);
  }

  @MessagePattern(RolePatterns.UpdateRole)
  update(@Payload() data: IUpdateRole) {
    return this.roleService.update(data);
  }

  @MessagePattern(RolePatterns.RemovedPermissionFromRole)
  removePermissionFromRole(@Payload() data: IRemovePermissionFromRole) {
    return this.roleService.removePermissionFromRole(data);
  }

  @MessagePattern(RolePatterns.RemoveRoleFromUser)
  removeRoleFromUser(@Payload() data: IRemoveRoleFromUser) {
    return this.roleService.removeRoleFromUser(data);
  }
}
