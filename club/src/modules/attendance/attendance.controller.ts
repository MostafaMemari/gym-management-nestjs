import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { AttendancePatterns } from './patterns/attendance.pattern';
import { AttendanceService } from './attendance.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { IRecordAttendance, ISearchAttendanceQuery } from './interfaces/attendance.interface';

@Controller()
export class AttendanceController {
  constructor(private readonly clubService: AttendanceService) {}

  @MessagePattern(AttendancePatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(AttendancePatterns.CreateAttendance)
  create(@Payload() data: { user: IUser; createAttendanceDto: IRecordAttendance }) {
    const { user, createAttendanceDto } = data;

    return this.clubService.create(user, createAttendanceDto);
  }
  // @MessagePattern(AttendancePatterns.UpdateAttendance)
  // update(@Payload() data: { user: IUser; clubId: number; updateAttendanceDto: IUpdateAttendance }) {
  //   const { user, clubId, updateAttendanceDto } = data;

  //   return this.clubService.update(user, clubId, updateAttendanceDto);
  // }

  @MessagePattern(AttendancePatterns.GetAttendances)
  findAll(@Payload() data: { user: IUser; queryAttendanceDto: ISearchAttendanceQuery; paginationDto: IPagination }) {
    const { user, queryAttendanceDto, paginationDto } = data;

    return this.clubService.getAll(user, { queryAttendanceDto, paginationDto });
  }

  @MessagePattern(AttendancePatterns.GetAttendance)
  findOne(@Payload() data: { user: IUser; clubId: number }) {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }
}
