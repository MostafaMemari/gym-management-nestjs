import { Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IAssignRole } from '../../common/interfaces/rbac.interface';

import { UserService } from '../user/user.service';

@Injectable()
export class RbacService {
  constructor(private readonly userService: UserService) {}

  async assignRole(roleDto: IAssignRole): Promise<ServiceResponse> {
    try {
      return this.userService.changeRole(roleDto);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
