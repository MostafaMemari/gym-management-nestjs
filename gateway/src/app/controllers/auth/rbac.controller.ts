import { Body, ConflictException, Controller, Inject, Post } from '@nestjs/common';
import { Services } from '../../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '../../../common/enums/role.enum';
import { AuthController } from './auth.controller';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { RbacPatterns } from '../../../common/enums/auth.events';
import { AssignRoleDto } from '../../../common/dtos/auth-service/rbac.dto';
import { ApiConsumes } from '@nestjs/swagger';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '../../../common/dtos/user.dto';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { RbacMessages } from '../../../common/enums/auth.messages';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';

@Controller('rbac')
@AuthDecorator()
export class RbacController {
  constructor(
    @Inject(Services.AUTH) private readonly authServiceClientProxy: ClientProxy,
    private readonly authController: AuthController,
  ) { }

  private readonly timeout: number = 5000;

  @Post('assign-role')
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async assignRole(@Body() assignRoleDto: AssignRoleDto, @GetUser() user: User): Promise<ServiceResponse> {
    try {
      await this.authController.checkConnection();

      if (user.id == assignRoleDto.userId) throw new ConflictException(RbacMessages.CannotChangeRole);

      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClientProxy.send(RbacPatterns.AssignRole, assignRoleDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to assign role', 'RbacService');
    }
  }
}
