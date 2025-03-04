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
import { BeltExamPatterns } from '../../../common/enums/club.events';
import { CreateBeltExamDto, QueryBeltExamDto, UpdateBeltExamDto } from '../../../common/dtos/club-service/belt-exam.dto';

@Controller('belt-exams')
@ApiTags('belt exams')
@AuthDecorator()
export class BeltExamController {
  constructor(@Inject(Services.CLUB) private readonly beltExamServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.beltExamServiceClient.send(BeltExamPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('BeltExam service is not connected');
    }
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createBeltExamDto: CreateBeltExamDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.beltExamServiceClient.send(BeltExamPatterns.CreateBeltExam, { createBeltExamDto: { ...createBeltExamDto } }).pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create beltExam', 'BeltExamService');
    }
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBeltExamDto: UpdateBeltExamDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.beltExamServiceClient
          .send(BeltExamPatterns.UpdateBeltExam, { beltExamId: id, updateBeltExamDto: { ...updateBeltExamDto } })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated beltExam', 'BeltExamService');
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll(@Query() paginationDto: PaginationDto, @Query() queryBeltExamDto: QueryBeltExamDto): Promise<any> {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.beltExamServiceClient.send(BeltExamPatterns.GetBeltExams, { queryBeltExamDto, paginationDto }).pipe(timeout(5000)),
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
        this.beltExamServiceClient.send(BeltExamPatterns.GetBeltExam, { beltExamId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get beltExam', 'BeltExamService');
    }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.beltExamServiceClient.send(BeltExamPatterns.RemoveBeltExam, { beltExamId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove beltExam', 'BeltExamService');
    }
  }
}
