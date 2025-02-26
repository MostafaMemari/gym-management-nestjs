import { Controller, Get, HttpStatus, Inject, Param, ParseIntPipe, Query } from '@nestjs/common';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ApiTags } from '@nestjs/swagger';
import { UserPatterns } from '../../common/enums/user.events';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { PaginationDto, SearchDto } from '../../common/dtos/shared.dto';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { AuthDecorator } from '../../common/decorators/auth.decorator';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/role.enum';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../common/dtos/user.dto';

@Controller('user')
@ApiTags('User')
@AuthDecorator()
export class UserController {
  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) { }

  @Roles(Role.SUPER_ADMIN)
  @Get()
  async getUsers(@Query() paginationDto: PaginationDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.GetUsers, { ...paginationDto }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to getUsers', 'UserService');
    }
  }

  @Roles(Role.SUPER_ADMIN)
  @Get('search')
  async searchUser(@Query() searchDto: SearchDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.SearchUser, { ...searchDto }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to search', 'UserService');
    }
  }

  @Get("profile")
  getProfile(@GetUser() user: User) {
    return handleServiceResponse({ data: { user }, error: false, message: "", status: HttpStatus.OK })
  }

  @Roles(Role.SUPER_ADMIN)
  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.GetUserById, { userId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to getUserById', 'UserService');
    }
  }
}
