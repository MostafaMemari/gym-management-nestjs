import { Controller } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RbacPatterns } from '../../common/enums/rbac.events';
import { IAssignRole } from '../../common/interfaces/rbac.interface';

@Controller()
export class RbacController {
  constructor(private readonly rbacService: RbacService) { }

  @MessagePattern(RbacPatterns.AssignRole)
  assignRole(@Payload() data: IAssignRole) {
    return this.rbacService.assignRole(data)
  }
}
