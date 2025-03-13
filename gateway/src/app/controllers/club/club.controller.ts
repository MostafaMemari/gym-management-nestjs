import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { CreateClubDto, QueryClubDto, UpdateClubDto } from '../../../common/dtos/club-service/club.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { ClubPatterns } from '../../../common/enums/club.events';
import { Role } from '../../../common/enums/role.enum';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('clubs')
@ApiTags('Clubs')
@AuthDecorator()
export class ClubController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createClubDto: CreateClubDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(ClubPatterns.CREATE, {
            user,
            createClubDto: { ...createClubDto },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create club', 'ClubService');
    }
  }

  @Put(':id')
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateClubDto: UpdateClubDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.UPDATE, { user, clubId: id, updateClubDto: { ...updateClubDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated club', 'ClubService');
    }
  }

  @Get()
  @Roles(Role.ADMIN_CLUB)
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryClubDto: QueryClubDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.GET_ALL, { user, queryClubDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(ClubPatterns.GET_ONE, { user, clubId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get club', 'ClubService');
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN_CLUB)
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(ClubPatterns.REMOVE, { user, clubId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove club', 'ClubService');
    }
  }
}
