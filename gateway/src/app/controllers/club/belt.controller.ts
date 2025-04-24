import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { CreateBeltDto, QueryBeltDto, UpdateBeltDto } from '../../../common/dtos/club-service/belt.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { BeltPatterns } from '../../../common/enums/club-service/gym.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('belts')
@ApiTags('Belts')
@AuthDecorator()
export class BeltController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createBeltDto: CreateBeltDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltPatterns.CREATE, { createBeltDto: { ...createBeltDto } }).pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create belt', 'BeltService');
    }
  }

  @Put(':id')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBeltDto: UpdateBeltDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltPatterns.UPDATE, { beltId: id, updateBeltDto: { ...updateBeltDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated belt', 'BeltService');
    }
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto, @Query() queryBeltDto: QueryBeltDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltPatterns.GET_ALL, { queryBeltDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(BeltPatterns.GET_ONE, { beltId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get belt', 'BeltService');
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(BeltPatterns.REMOVE, { beltId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove belt', 'BeltService');
    }
  }
}
