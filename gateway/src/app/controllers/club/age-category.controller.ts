import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '../../../common/enums/role.enum';
import { AgeCategoryPatterns } from '../../../common/enums/club.events';
import { CreateAgeCategoryDto, QueryAgeCategoryDto, UpdateAgeCategoryDto } from '../../../common/dtos/club-service/age-category.dto';

@Controller('age-categories')
@ApiTags('age-categories')
@AuthDecorator()
export class AgeCategoryController {
  constructor(@Inject(Services.CLUB) private readonly ageCategoryServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.ageCategoryServiceClient.send(AgeCategoryPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('AgeCategory service is not connected');
    }
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createAgeCategoryDto: CreateAgeCategoryDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.ageCategoryServiceClient
          .send(AgeCategoryPatterns.CreateAgeCategory, { createAgeCategoryDto: { ...createAgeCategoryDto } })
          .pipe(timeout(10000)),
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
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.ageCategoryServiceClient
          .send(AgeCategoryPatterns.UpdateAgeCategory, { ageCategoryId: id, updateAgeCategoryDto: { ...updateAgeCategoryDto } })
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
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.ageCategoryServiceClient.send(AgeCategoryPatterns.GetAgeCategories, { queryAgeCategoryDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.ageCategoryServiceClient.send(AgeCategoryPatterns.GetAgeCategory, { ageCategoryId: id }).pipe(timeout(5000)),
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
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.ageCategoryServiceClient.send(AgeCategoryPatterns.RemoveAgeCategory, { ageCategoryId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove ageCategory', 'AgeCategoryService');
    }
  }
}
