import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { QueryAttendanceDto, RecordAttendanceDto, UpdateAttendanceDto } from '../../../common/dtos/club-service/attendance.dto';
import { AttendancePatterns } from '../../../common/enums/club-service/gym.events';
import { Role } from '../../../common/enums/role.enum';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { PaginationDto } from 'src/common/dtos/shared.dto';

@Controller('attendances')
@ApiTags('Attendances')
@AuthDecorator()
export class AttendanceController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createAttendanceDto: RecordAttendanceDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AttendancePatterns.CREATE, { user, createAttendanceDto: { ...createAttendanceDto } }).pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create attendance', 'AttendanceService');
    }
  }

  @Put(':id')
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateAttendanceDto: UpdateAttendanceDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(AttendancePatterns.UPDATE, { user, attendanceId: id, updateAttendanceDto: { ...updateAttendanceDto } })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated attendance', 'AttendanceService');
    }
  }

  @Get()
  @Roles(Role.ADMIN_CLUB)
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryAttendanceDto: QueryAttendanceDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AttendancePatterns.GET_ALL, { user, queryAttendanceDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AttendancePatterns.GET_ONE, { user, attendanceId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get attendance', 'AttendanceService');
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN_CLUB)
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(AttendancePatterns.REMOVE, { user, attendanceId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove attendance', 'AttendanceService');
    }
  }
}
