import { Controller } from '@nestjs/common';
import { RoleService } from './role.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolePatterns } from '../../common/enums/role.events';
import { IAssignPermission, ICreateRole, IRolesFilter } from '../../common/interfaces/role.interface';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern(RolePatterns.CreateRole)
  create(@Payload() data: ICreateRole) {
    return this.roleService.create(data);
  }

  @MessagePattern(RolePatterns.GetOneRole)
  getOne(@Payload() data: { roleId: number }) {
    return this.roleService.findOne(data);
  }

  @MessagePattern(RolePatterns.AssignPermissionToRole)
  assignPermissionToRole(@Payload() data: IAssignPermission) {
    return this.roleService.assignPermission(data);
  }

  @MessagePattern(RolePatterns.GetRoles)
  getAll(@Payload() data: IRolesFilter) {
    return this.roleService.findAll(data);
  }
}
