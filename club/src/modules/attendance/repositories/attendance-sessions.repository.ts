import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { AttendanceSessionEntity } from '../entities/attendance-sessions.entity';

import { EntityName } from '../../../common/enums/entity.enum';
import { IAttendanceFilter } from '../interfaces/attendance.interface';

@Injectable()
export class AttendanceSessionRepository extends Repository<AttendanceSessionEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(AttendanceSessionEntity, dataSource.createEntityManager());
  }

  async createAttendanceSession(data: Partial<AttendanceSessionEntity>, queryRunner?: QueryRunner): Promise<AttendanceSessionEntity> {
    const student = this.create(data);

    return queryRunner ? await queryRunner.manager.save(student) : await this.save(student);
  }

  async getAttendancesWithFilters(
    userId: number,
    filters: IAttendanceFilter,
    page: number,
    take: number,
  ): Promise<[AttendanceSessionEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.AttendanceSessions)
      .leftJoinAndSelect('attendance_sessions.attendances', 'attendances')
      .leftJoin('attendances.student', 'student')
      .addSelect(['student.id', 'student.full_name'])
      .leftJoin('attendance_sessions.session', 'session')
      .leftJoin('session.club', 'club')
      .where('club.ownerId = :userId', { userId });

    if (filters?.start_date || filters?.end_date) {
      queryBuilder.andWhere(`attendance_sessions.date BETWEEN :start_date AND :end_date`, {
        start_date: filters.start_date || '1900-01-01',
        end_date: filters.end_date || '2100-12-31',
      });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`attendance_sessions.date`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('attendance_sessions.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`attendance_sessions.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('attendance_sessions.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findAttendanceByIdAndDate(sessionId: number, date: Date): Promise<AttendanceSessionEntity | null> {
    return this.findOne({ where: { id: sessionId, date } });
  }

  async findByIdAndOwner(attendanceId: number, userId: number): Promise<AttendanceSessionEntity | null> {
    return this.createQueryBuilder(EntityName.AttendanceSessions)
      .leftJoin('attendance_sessions.session', 'session')
      .leftJoin('session.club', 'club')
      .where('attendance_sessions.id = :attendanceId', { attendanceId })
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();
  }
  async findByIdAndOwnerRelationAttendance(attendanceId: number, userId: number): Promise<AttendanceSessionEntity | null> {
    return this.createQueryBuilder(EntityName.AttendanceSessions)
      .leftJoinAndSelect('attendance_sessions.attendances', 'attendances')
      .leftJoin('attendance_sessions.session', 'session')
      .leftJoin('session.club', 'club')
      .where('attendance_sessions.id = :attendanceId', { attendanceId })
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();
  }
  async findByIdAndOwnerRelationAttendanceStudents(attendanceId: number, userId: number): Promise<AttendanceSessionEntity | null> {
    return this.createQueryBuilder(EntityName.AttendanceSessions)
      .leftJoinAndSelect('attendance_sessions.attendances', 'attendances')
      .leftJoin('attendances.student', 'student')
      .addSelect(['student.id', 'student.full_name'])
      .leftJoin('attendance_sessions.session', 'session')
      .leftJoin('session.club', 'club')
      .where('attendance_sessions.id = :attendanceId', { attendanceId })
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();
  }

  async findOwnedAttendancesByIds(attendanceIds: number[]): Promise<AttendanceSessionEntity[]> {
    return this.find({
      where: { id: In(attendanceIds) },
    });
  }
}

const validSortFields = ['date', 'created_at', 'updated_at'];
