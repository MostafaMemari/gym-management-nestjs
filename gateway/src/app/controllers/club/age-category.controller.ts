import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { CreateAgeCategoryDto, QueryAgeCategoryDto, UpdateAgeCategoryDto } from '../../../common/dtos/club-service/age-category.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { AgeCategoryPatterns } from '../../../common/enums/club-service/gym.events';
import { Role } from '../../../common/enums/role.enum';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('age-categories')
@ApiTags('Age Categories')
@AuthDecorator()
export class AgeCategoryController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createAgeCategoryDto: CreateAgeCategoryDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AgeCategoryPatterns.CREATE, { createAgeCategoryDto: { ...createAgeCategoryDto } }).pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create age category', 'AgeCategoryService');
    }
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateAgeCategoryDto: UpdateAgeCategoryDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(AgeCategoryPatterns.UPDATE, { ageCategoryId: id, updateAgeCategoryDto: { ...updateAgeCategoryDto } })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated ageCategory', 'AgeCategoryService');
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll(@Query() paginationDto: PaginationDto, @Query() queryAgeCategoryDto: QueryAgeCategoryDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AgeCategoryPatterns.GET_ALL, { queryAgeCategoryDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AgeCategoryPatterns.GET_ONE, { ageCategoryId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get ageCategory', 'AgeCategoryService');
    }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AgeCategoryPatterns.REMOVE, { ageCategoryId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove ageCategory', 'AgeCategoryService');
    }
  }
}
