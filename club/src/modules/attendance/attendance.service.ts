import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { AttendanceRepository } from './repositories/attendance.repository';

import { CacheService } from '../cache/cache.service';

import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { StudentService } from '../student/student.service';
import { ClubService } from '../club/club.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IRecordAttendance } from './interfaces/attendance.interface';
import { SessionService } from '../session/session.service';
import { DayOfWeek } from '../session/enums/days-of-week.enum';
import { ResponseUtil } from 'src/common/utils/response';
import { AttendanceMessages } from './enums/attendance.message';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceSessionRepository } from './repositories/attendance-sessions.repository';
import { AttendanceSessionEntity } from './entities/attendance-sessions.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceSessionRepository: AttendanceSessionRepository,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly sessionService: SessionService,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: IUser, createAttendanceDto: IRecordAttendance) {
    const { sessionId, date, attendances } = createAttendanceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const session = await this.sessionService.checkSessionOwnershipRelationStudents(sessionId, user.id);
      this.validateAllowedDays(session.days, date);
      await this.checkDuplicateAttendanceSession(sessionId, new Date(date));

      const attendanceSession = await this.attendanceSessionRepository.createAttendanceSession(
        { date: new Date(date), session },
        queryRunner,
      );

      const validStudentIds = session.students.map((student) => student.id);
      const attendanceEntities = await this.attendanceRepository.createAttendanceEntities(
        attendances,
        validStudentIds,
        attendanceSession,
        queryRunner,
      );

      if (attendanceEntities.length === 0) {
        throw new BadRequestException(AttendanceMessages.NO_STUDENTS_ELIGIBLE);
      }

      // await this.attendanceRepository.save(attendanceEntities);
      await queryRunner.commitTransaction();
      return ResponseUtil.success(createAttendanceDto, AttendanceMessages.CREATE_SUCCESS);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseUtil.success(error?.message || AttendanceMessages.CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }

  // async getAttendanceReport(sessionId: number, startDate: string, endDate: string): Promise<AttendanceReportDto> {
  //   const attendanceSessions = await this.attendanceSessionRepository.find({
  //     where: {
  //       sessionId,
  //       date: Between(new Date(startDate), new Date(endDate)),
  //     },
  //     relations: ['attendances', 'attendances.student'],
  //     order: { date: 'ASC' },
  //   });

  //   const report: AttendanceReportDto = attendanceSessions.reduce((acc, session) => {
  //     const dateStr = session.date.toISOString().split('T')[0];
  //     acc[dateStr] = session.attendances.map((att) => ({
  //       studentId: att.studentId,
  //       fullName: att.student.full_name,
  //       status: att.status,
  //       note: att.note,
  //       attendanceDateTime: att.attendanceDateTime.toISOString(),
  //     }));
  //     return acc;
  //   }, {} as AttendanceReportDto);

  //   return report;
  // }

  validateAllowedDays(allowedDays: string[], date: string): void {
    const inputDate = new Date(date);
    const dayOfWeek = inputDate.toLocaleString('en-US', { weekday: 'long' });

    if (!allowedDays.includes(dayOfWeek)) {
      throw new Error(AttendanceMessages.INVALID_SESSION_DAY.replace('{dayOfWeek}', dayOfWeek));
    }
  }

  async checkDuplicateAttendanceSession(sessionId: number, date: Date): Promise<void> {
    const session = await this.attendanceSessionRepository.findAttendanceByIdAndDate(sessionId, date);
    if (session) throw new BadRequestException(AttendanceMessages.ALREADY_RECORDED);
  }
}
