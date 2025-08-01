import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { CreateBeltExamDto, QueryBeltExamDto, UpdateBeltExamDto } from '../../../common/dtos/club-service/belt-exam.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { BeltExamPatterns } from '../../../common/enums/club-service/gym.events';
import { Role } from '../../../common/enums/auth-user-service/role.enum';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AccessRole } from '../../../common/decorators/accessRole.decorator';

@Controller('belt-exams')
@ApiTags('Belt Exams')
@AuthDecorator()
export class BeltExamController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createBeltExamDto: CreateBeltExamDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltExamPatterns.CREATE, { createBeltExamDto: { ...createBeltExamDto } }).pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create beltExam', 'BeltExamService');
    }
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateBeltExamDto: UpdateBeltExamDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltExamPatterns.UPDATE, { beltExamId: id, updateBeltExamDto: { ...updateBeltExamDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated beltExam', 'BeltExamService');
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async findAll(@Query() paginationDto: PaginationDto, @Query() queryBeltExamDto: QueryBeltExamDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltExamPatterns.GET_ALL, { queryBeltExamDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(BeltExamPatterns.GET_ONE, { beltExamId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get beltExam', 'BeltExamService');
    }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(BeltExamPatterns.REMOVE, { beltExamId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove beltExam', 'BeltExamService');
    }
  }
}
