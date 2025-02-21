import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { PaginationDto, QueryClubDto } from '../../../common/dtos/shared.dto';
import { ClubPatterns } from '../../../common/enums/club.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { CreateClubDto, UpdateClubDto } from '../../../common/dtos/club-service/club.dto';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '../../../common/dtos/user.dto';

@Controller('clubs')
@ApiTags('clubs')
@AuthDecorator()
export class ClubController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.clubServiceClient.send(ClubPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Club service is not connected');
    }
  }

  @Post()
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createClubDto: CreateClubDto) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.CreateClub, { createClubDto: { ...createClubDto } }).pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create club', 'ClubService');
    }
  }

  @Put(':id')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateClubDto: UpdateClubDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.UpdateClub, { clubId: id, updateClubDto: { ...updateClubDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated club', 'ClubService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryDto: QueryClubDto): Promise<any> {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.GetClubs, { user, queryDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.GetClub, { clubId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get club', 'ClubService');
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(ClubPatterns.RemoveUserClub, { clubId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove club', 'ClubService');
    }
  }
}
