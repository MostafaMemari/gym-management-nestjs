import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
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
import { IAttendanceFilter, IRecordAttendance, IStudentAttendance, IUpdateRecordAttendance } from './interfaces/attendance.interface';
import { AttendanceSessionRepository } from './repositories/attendance-sessions.repository';
import { AttendanceSessionEntity } from './entities/attendance-sessions.entity';

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
  async update(user: IUser, attendanceId: number, updateAttendanceDto: IUpdateRecordAttendance) {
    const { sessionId, date, attendances } = updateAttendanceDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let attendanceEntities = null;

    try {
      const attendanceSession = await this.checkSessionOwnershipRelationAttendance(attendanceId, user.id);
      const session = await this.sessionService.checkSessionOwnershipRelationStudents(sessionId || attendanceSession.sessionId, user.id);

      if (date) {
        this.validateAllowedDays(session.days, date);
        await this.checkDuplicateAttendanceSession(session.id, new Date(date));

        attendanceSession.date = new Date(date);
        await queryRunner.manager.save(attendanceSession);
      }

      if (attendances) {
        await this.attendanceRepository.deleteAttendanceBySession(attendanceSession.id, queryRunner);
        const validStudentIds = session.students.map((student) => student.id);
        attendanceEntities = await this.attendanceRepository.createAttendanceEntities(
          attendances,
          validStudentIds,
          attendanceSession,
          queryRunner,
        );

        if (attendanceEntities.length === 0) throw new BadRequestException(AttendanceMessages.NO_STUDENTS_ELIGIBLE);
      }

      await queryRunner.commitTransaction();

      return ResponseUtil.success(
        {
          ...updateAttendanceDto,
          attendances: attendanceEntities
            ? attendanceEntities.map((attendance) => ({
                studentId: attendance.studentId,
                status: attendance.status,
              }))
            : [],
        },
        AttendanceMessages.UPDATE_SUCCESS,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseUtil.error(error?.message || AttendanceMessages.CREATE_FAILURE, error?.status);
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

      const formattedData = attendances.map((item) => ({
        id: item.id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        sessionId: item.sessionId,
        date: item.date,
        attendances: item.attendances.map((attendance) => ({
          id: attendance.student.id,
          full_name: attendance.student.full_name,
          status: attendance.status,
          note: attendance?.note,
        })),
      }));

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(formattedData, pageMetaDto);

      await this.cacheService.set(cacheKey, result, CacheTTLSeconds.ATTENDANCES);

      // const report: IStudentAttendance = attendances.reduce((acc, session) => {
      //   const date = new Date(session.date);
      //   const dateStr = date.toISOString().split('T')[0];
      //   acc[dateStr] = session.attendances.map((att) => ({
      //     studentId: att.studentId,
      //     fullName: att.student.full_name,
      //     status: att.status,
      //     note: att.note,
      //   }));
      //   return acc;
      // }, {} as IStudentAttendance);

      // return report;

      return ResponseUtil.success(result.data, AttendanceMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async reportAll(user: IUser, query: { queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }): Promise<any> {
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

      const formattedData = attendances.map(({ date, attendances }) => ({
        date: new Date(date).toISOString().split('T')[0],
        attendances: attendances.map(({ studentId, student, status, note }) => ({
          studentId,
          fullName: student.full_name,
          status,
          note,
        })),
      }));

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(formattedData, pageMetaDto);

      await this.cacheService.set(cacheKey, result, CacheTTLSeconds.ATTENDANCES);

      return ResponseUtil.success(result.data, AttendanceMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.GET_ALL_FAILURE, error?.status);
    }
  }

  async findOneById(user: IUser, attendanceId: number) {
    try {
      const attendance = await this.checkSessionOwnershipRelationAttendanceStudents(attendanceId, user.id);

      console.log(attendance);

      return ResponseUtil.success(attendance, AttendanceMessages.GET_SUCCESS);
    } catch (error) {
      return ResponseUtil.error(error?.message || AttendanceMessages.GET_FAILURE, error?.status);
    }
  }
  async remove(user: IUser, attendanceId: number) {
    try {
      const attendance = await this.checkAttendanceOwnership(attendanceId, user.id);

      const removedClub = await this.attendanceSessionRepository.delete({ id: attendanceId });

      if (!removedClub.affected) ResponseUtil.error(AttendanceMessages.REMOVE_FAILURE);

      return ResponseUtil.success(attendance, AttendanceMessages.REMOVE_SUCCESS);
    } catch (error) {
      return ResponseUtil.error(error?.message || AttendanceMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async checkAttendanceOwnership(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findByIdAndOwner(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }

  async checkSessionOwnershipRelationAttendance(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findByIdAndOwnerRelationAttendance(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }
  async checkSessionOwnershipRelationAttendanceStudents(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findByIdAndOwnerRelationAttendanceStudents(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }

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
