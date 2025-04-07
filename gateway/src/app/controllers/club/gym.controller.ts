import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { CreateGymDto, QueryGymDto, UpdateGymDto } from '../../../common/dtos/club-service/gym.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { GymPatterns } from '../../../common/enums/club-service/gym.events';
import { Role } from '../../../common/enums/role.enum';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AccessRole } from '../../../common/decorators/accessRole.decorator';

@Controller('gyms')
@ApiTags('Gyms')
@AuthDecorator()
export class GymController {
  constructor(@Inject(Services.CLUB) private readonly gymServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.ADMIN_CLUB)
  @AccessRole(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createGymDto: CreateGymDto) {
    try {
      await checkConnection(Services.CLUB, this.gymServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.gymServiceClient
          .send(GymPatterns.CREATE, {
            user,
            createGymDto: { ...createGymDto },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create gym', 'GymService');
    }
  }

  @Put(':id')
  @Roles(Role.ADMIN_CLUB)
  @AccessRole(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateGymDto: UpdateGymDto) {
    try {
      await checkConnection(Services.CLUB, this.gymServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.gymServiceClient.send(GymPatterns.UPDATE, { user, gymId: id, updateGymDto: { ...updateGymDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated gym', 'GymService');
    }
  }

  @Get()
  @Roles(Role.ADMIN_CLUB)
  @AccessRole(Role.ADMIN_CLUB)
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryGymDto: QueryGymDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.gymServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.gymServiceClient.send(GymPatterns.GET_ALL, { user, queryGymDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  @AccessRole(Role.ADMIN_CLUB)
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.gymServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.gymServiceClient.send(GymPatterns.GET_ONE, { user, gymId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get gym', 'GymService');
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN_CLUB)
  @AccessRole(Role.ADMIN_CLUB)
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.gymServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.gymServiceClient.send(GymPatterns.REMOVE, { user, gymId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove gym', 'GymService');
    }
  }
}
