import { Controller } from '@nestjs/common';
import { RoleService } from './role.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RolePatterns } from 'src/common/enums/role.events';
import { ICreateRole } from 'src/common/interfaces/role.interface';

@Controller()
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @MessagePattern(RolePatterns.CreateRole)
  create(@Payload() data: ICreateRole) {
    return this.roleService.create(data);
  }

  @MessagePattern(RolePatterns.CreateRole)
  getOne(@Payload() data: { roleId: number }) {
    return this.roleService.findOne(data);
  }
}
