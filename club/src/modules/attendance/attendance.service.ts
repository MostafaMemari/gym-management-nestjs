import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { formatDate, isAfter } from 'date-fns';
import { DataSource } from 'typeorm';

import { AttendanceSessionEntity } from './entities/attendance-sessions.entity';
import { AttendanceMessages } from './enums/attendance.message';
import { IAttendanceFilter, IRecordAttendanceDto, IStudentAttendance, IUpdateRecordAttendance } from './interfaces/attendance.interface';
import { AttendanceSessionRepository } from './repositories/attendance-sessions.repository';
import { AttendanceRepository } from './repositories/attendance.repository';

import { CacheService } from '../cache/cache.service';
import { SessionService } from '../session/session.service';
import { StudentService } from '../student/student.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly attendanceSessionRepository: AttendanceSessionRepository,
    private readonly attendanceRepository: AttendanceRepository,
    private readonly studentService: StudentService,
    private readonly sessionService: SessionService,
    private readonly cacheService: CacheService,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: IUser, createAttendanceDto: IRecordAttendanceDto): Promise<ServiceResponse> {
    const { sessionId, date, attendances } = createAttendanceDto;
    const userId = user.id;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const session = await this.sessionService.validateOwnershipRelationStudents(sessionId, user.id);

      this.checkDateIsNotInTheFuture(date);
      this.validateAllowedDays(session.days, date);
      await this.checkDuplicateAttendanceSession(sessionId, date);

      await this.verifyCoachStudentsAttendance(attendances, session.coachId);

      const attendanceSession = await this.attendanceSessionRepository.createAttendanceSession(
        { date, sessionId: session.id, coachId: session.coachId },
        queryRunner,
      );

      const sessionStudentIds = session.students.map((student) => student.id);
      const attendanceEntities = await this.attendanceRepository.createAttendanceEntities(
        attendances,
        sessionStudentIds,
        attendanceSession,
        queryRunner,
      );

      if (attendanceEntities.length === 0) throw new BadRequestException(AttendanceMessages.NO_STUDENTS_ELIGIBLE);

      await queryRunner.commitTransaction();
      await this.clearAttendanceCacheByUser(userId);

      return ResponseUtil.success({
        ...createAttendanceDto,
        coachId: session.coachId,
        attendances: attendanceEntities.map((attendance) => ({
          studentId: attendance.studentId,
          status: attendance.status,
        })),
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      ResponseUtil.error(error?.message || AttendanceMessages.CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }
  async update(user: IUser, attendanceId: number, updateAttendanceDto: IUpdateRecordAttendance): Promise<ServiceResponse> {
    const { sessionId, date, attendances } = updateAttendanceDto;
    const userId = user.id;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let attendanceEntities = null;

    try {
      const attendanceSession = await this.validateOwnershipById(attendanceId, user.id);
      const session = await this.sessionService.validateOwnershipRelationStudents(sessionId || attendanceSession.sessionId, user.id);

      if (date) {
        this.validateAllowedDays(session.days, date);
        this.checkDateIsNotInTheFuture(date);
        await this.checkDuplicateAttendanceSession(session.id, date);

        attendanceSession.date = date;
        await queryRunner.manager.save(attendanceSession);
      }

      if (attendances) {
        await this.verifyCoachStudentsAttendance(attendances, session.coachId);

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

      await this.clearAttendanceCacheByUser(userId);
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
      ResponseUtil.error(error?.message || AttendanceMessages.CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }
  async getAll(user: IUser, query: { queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
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
          is_guest: attendance.is_guest,
          note: attendance?.note,
        })),
      }));

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(formattedData, pageMetaDto);

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
  async reportAll(user: IUser, query: { queryAttendanceDto: IAttendanceFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
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

      return ResponseUtil.success(result.data, AttendanceMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, attendanceId: number): Promise<ServiceResponse> {
    try {
      const attendance = await this.validateOwnershipByIdWithStudents(attendanceId, user.id);

      return ResponseUtil.success(attendance, AttendanceMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.GET_FAILURE, error?.status);
    }
  }
  async remove(user: IUser, attendanceId: number): Promise<ServiceResponse> {
    const userId = user.id;
    try {
      const attendance = await this.validateOwnershipById(attendanceId, user.id);

      const removedClub = await this.attendanceSessionRepository.delete({ id: attendanceId });

      if (!removedClub.affected) ResponseUtil.error(AttendanceMessages.REMOVE_FAILURE);
      await this.clearAttendanceCacheByUser(userId);
      return ResponseUtil.success(attendance, AttendanceMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AttendanceMessages.REMOVE_FAILURE, error?.status);
    }
  }

  private async validateOwnershipById(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findOwnedById(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }
  private async validateOwnershipByIdWithAttendances(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findOwnedWithAttendances(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }
  private async validateOwnershipByIdWithStudents(attendanceId: number, userId: number): Promise<AttendanceSessionEntity> {
    const attendance = await this.attendanceSessionRepository.findOwnedWithStudents(attendanceId, userId);
    if (!attendance) throw new NotFoundException(AttendanceMessages.NOT_FOUND);
    return attendance;
  }

  async verifyCoachStudentsAttendance(attendance: IStudentAttendance[], coachId: number) {
    const studentIdsAttendances = attendance.map((attendance) => attendance.studentId);
    await this.studentService.validateStudentsIdsByCoach(studentIdsAttendances, coachId);
  }

  private async checkDuplicateAttendanceSession(sessionId: number, date: Date): Promise<void> {
    const session = await this.attendanceSessionRepository.findAttendanceByIdAndDate(sessionId, date);
    if (session) throw new BadRequestException(AttendanceMessages.ALREADY_RECORDED);
  }

  private validateAllowedDays(allowedDays: string[], date: Date | string): void {
    const inputDate = new Date(date);

    const dayOfWeek = formatDate(inputDate, 'EEEE');

    if (!allowedDays.includes(dayOfWeek)) {
      throw new BadRequestException(AttendanceMessages.INVALID_SESSION_DAY.replace('{dayOfWeek}', dayOfWeek));
    }
  }
  private checkDateIsNotInTheFuture(date: Date): void {
    const today = new Date();
    const inputDate = new Date(date);

    if (isAfter(inputDate, today)) {
      throw new BadRequestException(AttendanceMessages.FUTURE_DATE_NOT_ALLOWED);
    }
  }

  private async clearAttendanceCacheByUser(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.ATTENDANCES}-userId:${userId}*`);
  }
}
