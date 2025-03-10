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
import { AttendancePatterns } from '../../../common/enums/club.events';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '../../../common/interfaces/user.interface';
import { RecordAttendanceDto } from '../../../common/dtos/club-service/attendance.dto';

@Controller('attendances')
@ApiTags('Attendances')
@AuthDecorator()
export class AttendanceController {
  constructor(@Inject(Services.CLUB) private readonly attendanceServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.attendanceServiceClient.send(AttendancePatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Attendance service is not connected');
    }
  }

  @Post()
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createAttendanceDto: RecordAttendanceDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.attendanceServiceClient
          .send(AttendancePatterns.CreateAttendance, { user, createAttendanceDto: { ...createAttendanceDto } })
          .pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create attendance', 'AttendanceService');
    }
  }

  // @Put(':id')
  // @Roles(Role.ADMIN_CLUB)
  // @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  // async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateAttendanceDto: UpdateAttendanceDto) {
  //   try {
  //     await this.checkConnection();
  //     const data: ServiceResponse = await lastValueFrom(
  //       this.attendanceServiceClient
  //         .send(AttendancePatterns.UpdateAttendance, { user, attendanceId: id, updateAttendanceDto: { ...updateAttendanceDto } })
  //         .pipe(timeout(5000)),
  //     );

  //     return handleServiceResponse(data);
  //   } catch (error) {
  //     handleError(error, 'Failed to updated attendance', 'AttendanceService');
  //   }
  // }

  // @Get()
  // @Roles(Role.ADMIN_CLUB)
  // async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryAttendanceDto: QueryAttendanceDto): Promise<any> {
  //   try {
  //     await this.checkConnection();

  //     const data: ServiceResponse = await lastValueFrom(
  //       this.attendanceServiceClient.send(AttendancePatterns.GetAttendances, { user, queryAttendanceDto, paginationDto }).pipe(timeout(5000)),
  //     );
  //     return handleServiceResponse(data);
  //   } catch (error) {}
  // }

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.attendanceServiceClient.send(AttendancePatterns.GetAttendance, { user, attendanceId: id }).pipe(timeout(5000)),
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
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.attendanceServiceClient.send(AttendancePatterns.RemoveAttendance, { user, attendanceId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove attendance', 'AttendanceService');
    }
  }
}
