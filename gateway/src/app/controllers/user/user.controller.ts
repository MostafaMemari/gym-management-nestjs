import { BadRequestException, Body, Controller, Delete, Get, HttpStatus, Inject, Param, ParseIntPipe, Put, Query } from '@nestjs/common';
import { Services } from '../../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { UserPatterns } from '../../../common/enums/user.events';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { QueryUsersDto, UpdateUserDto } from '../../../common/dtos/user-service/user.dto';
import { User } from '../../../common/interfaces/user.interface';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { SkipPermission } from 'src/common/decorators/skip-permission.decorator';

@Controller('user')
@ApiTags('User')
@AuthDecorator()
export class UserController {
  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) {}

  @Get()
  async getUsers(@Query() usersFilters: QueryUsersDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.GetUsers, usersFilters).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to getUsers', 'UserService');
    }
  }

  @Get('profile')
  @SkipPermission()
  getProfile(@GetUser() user: User) {
    return handleServiceResponse({ data: { ...user }, error: false, message: '', status: HttpStatus.OK });
  }

  @Put('profile')
  @SkipPermission()
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async updateProfile(@Body() updateUserDto: UpdateUserDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const updateUserData = { ...updateUserDto, userId: user.id };

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.UpdateUser, updateUserData).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to update profile', 'UserService');
    }
  }

  @Delete(':id')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async removeUser(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      if (id == user.id) throw new BadRequestException('You cannot delete your account.');

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.RemoveUser, { userId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove user', 'UserService');
    }
  }

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
