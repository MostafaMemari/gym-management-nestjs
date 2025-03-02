import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UserPatterns } from '../../common/enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { RbacMessages } from '../../common/enums/rbac.messages';
import { IAssignRole } from '../../common/interfaces/rbac.interface';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { ResponseUtil } from '../../common/utils/response.utils';

@Injectable()
export class RbacService {
  constructor(@Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy) {}

  private readonly timeout = 5000;

  async assignRole(roleDto: IAssignRole): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);

      const { role, userId } = roleDto;

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.ChangeUserRole, { role, userId }).pipe(timeout(this.timeout)),
      );

      if (result.error) throw result;

      return ResponseUtil.success({}, RbacMessages.AssignedRoleSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
