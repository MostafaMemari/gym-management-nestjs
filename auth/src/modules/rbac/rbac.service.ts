import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { AuthService } from '../auth/auth.service';
import { UserPatterns } from '../../common/enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { RbacMessages } from '../../common/enums/rbac.messages';
import { IAssignRole } from 'src/common/interfaces/rbac.interface';

@Injectable()
export class RbacService {
    constructor(
        @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
        private readonly authService: AuthService
    ) { }

    private readonly timeout = 5000

    async assignRole(roleDto: IAssignRole): Promise<ServiceResponse> {
        try {
            await this.authService.checkUserServiceConnection()

            const { role, userId } = roleDto

            const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.ChangeUserRole, { role, userId }).pipe(timeout(this.timeout)))

            if (result.error) throw result

            return {
                data: {},
                error: false,
                message: RbacMessages.AssignedRoleSuccess,
                status: HttpStatus.OK
            }
        } catch (error) {
            throw new RpcException(error)
        }
    }
}
