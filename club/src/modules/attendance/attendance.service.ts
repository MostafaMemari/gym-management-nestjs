import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Between, DataSource } from 'typeorm';

import { AttendanceRepository } from './repositories/attendance.repository';

import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { SessionService } from '../session/session.service';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceMessages } from './enums/attendance.message';
import { CacheKeys, CacheTTLSeconds } from './enums/cache.enum';
import { IAttendanceFilter, IRecordAttendance } from './interfaces/attendance.interface';
import { AttendanceSessionRepository } from './repositories/attendance-sessions.repository';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceSessionRepository: AttendanceSessionRepository,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly sessionService: SessionService,
    private readonly cacheService: CacheService,
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

      if (attendanceEntities.length === 0) throw new BadRequestException(AttendanceMessages.NO_STUDENTS_ELIGIBLE);

      await queryRunner.commitTransaction();

      return ResponseUtil.success({
        ...createAttendanceDto,
        attendances: attendanceEntities.map((attendance) => ({
          studentId: attendance.studentId,
          status: attendance.status,
        })),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseUtil.success(error?.message || AttendanceMessages.CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }
  async getAll(user: IUser, query: { queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }): Promise<any> {
    const { take, page } = query.paginationDto;

    try {
      const cacheKey = `${CacheKeys.ATTENDANCES}-${user.id}-${page}-${take}-${JSON.stringify(query.queryAttendanceDto)}`;

      const cachedData = await this.cacheService.get<PageDto<AttendanceEntity>>(cacheKey);
      if (cachedData) return ResponseUtil.success(cachedData.data, AttendanceMessages.GET_ALL_SUCCESS);

      const [attendances, count] = await this.attendanceSessionRepository.getAttendancesWithFilters(
        user.id,
        query.queryAttendanceDto,
        page,
        take,
      );

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(attendances, pageMetaDto);

      await this.cacheService.set(cacheKey, result, CacheTTLSeconds.ATTENDANCES);

      return ResponseUtil.success(result.data, AttendanceMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.GET_ALL_FAILURE, error?.status);
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
