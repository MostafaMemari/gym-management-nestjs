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
import { SkipPermission } from '../../../common/decorators/skip-permission.decorator';
import { AuthPatterns } from '../../../common/enums/auth.events';

@Controller('user')
@ApiTags('User')
@AuthDecorator()
export class UserController {
  private readonly timeout: number = 5000;

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    @Inject(Services.AUTH) private readonly authServiceClient: ClientProxy,
  ) { }

  @Get()
  async getUsers(@Query() usersFilters: QueryUsersDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.userServiceClient.send(UserPatterns.GetUsers, usersFilters).pipe(timeout(this.timeout)));

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
      await checkConnection(Services.AUTH, this.authServiceClient);

      const updateUserData: UpdateUserDto & { isVerifiedMobile?: boolean; userId: number } = { ...updateUserDto, userId: user.id };

      if (updateUserDto.mobile && user.mobile !== updateUserDto.mobile) {
        const sendOtpResult: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.SendOtp, { mobile: updateUserData.mobile }));
        handleServiceResponse(sendOtpResult)
        
        updateUserData.isVerifiedMobile = false;
      }

      const updatedUserResult: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(UserPatterns.UpdateUser, updateUserData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(updatedUserResult);
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

      const data: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(UserPatterns.RemoveUser, { userId: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove user', 'UserService');
    }
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(UserPatterns.GetUserById, { userId: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to getUserById', 'UserService');
    }
  }
}
