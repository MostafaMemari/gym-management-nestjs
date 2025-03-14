import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AttendancePatterns } from './patterns/attendance.pattern';
import { AttendanceService } from './attendance.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { IAttendanceFilter, IRecordAttendance, IUpdateRecordAttendance } from './interfaces/attendance.interface';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern(AttendancePatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(AttendancePatterns.CREATE)
  create(@Payload() data: { user: IUser; createAttendanceDto: IRecordAttendance }) {
    const { user, createAttendanceDto } = data;

    return this.attendanceService.create(user, createAttendanceDto);
  }

  @MessagePattern(AttendancePatterns.UPDATE)
  update(@Payload() data: { user: IUser; attendanceId: number; updateAttendanceDto: IUpdateRecordAttendance }) {
    const { user, attendanceId, updateAttendanceDto } = data;

    return this.attendanceService.update(user, attendanceId, updateAttendanceDto);
  }

  @MessagePattern(AttendancePatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }) {
    const { user, queryAttendanceDto, paginationDto } = data;

    return this.attendanceService.getAll(user, { queryAttendanceDto, paginationDto });
  }

  // @MessagePattern(AttendancePatterns.GetAttendance)
  // findOne(@Payload() data: { user: IUser; attendanceId: number }) {
  //   const { user, attendanceId } = data;

  //   return this.attendanceService.findOneById(user, attendanceId);
  // }

  // @MessagePattern(ClubPatterns.REMOVE)
  // remove(@Payload() data: { user: IUser; attendanceId: number }) {
  //   const { user, attendanceId } = data;

  //   return this.attendanceService.findOneById(user, attendanceId);
  // }
}
