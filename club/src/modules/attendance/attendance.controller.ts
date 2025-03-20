import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AttendanceService } from './attendance.service';
import { IAttendanceFilter, IRecordAttendanceDto, IUpdateRecordAttendance } from './interfaces/attendance.interface';
import { AttendancePatterns } from './patterns/attendance.pattern';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern(AttendancePatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(AttendancePatterns.CREATE)
  create(@Payload() data: { user: IUser; createAttendanceDto: IRecordAttendanceDto }): Promise<ServiceResponse> {
    const { user, createAttendanceDto } = data;

    return this.attendanceService.create(user, createAttendanceDto);
  }
  @MessagePattern(AttendancePatterns.UPDATE)
  update(@Payload() data: { user: IUser; attendanceId: number; updateAttendanceDto: IUpdateRecordAttendance }): Promise<ServiceResponse> {
    const { user, attendanceId, updateAttendanceDto } = data;

    return this.attendanceService.update(user, attendanceId, updateAttendanceDto);
  }
  @MessagePattern(AttendancePatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryAttendanceDto, paginationDto } = data;

    return this.attendanceService.getAll(user, { queryAttendanceDto, paginationDto });
  }
  @MessagePattern(AttendancePatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; attendanceId: number }): Promise<ServiceResponse> {
    const { user, attendanceId } = data;

    return this.attendanceService.findOneById(user, attendanceId);
  }
  @MessagePattern(AttendancePatterns.REMOVE)
  remove(@Payload() data: { user: IUser; attendanceId: number }): Promise<ServiceResponse> {
    const { user, attendanceId } = data;

    return this.attendanceService.remove(user, attendanceId);
  }
}
