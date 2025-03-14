import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { AttendanceEntity } from '../entities/attendance.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { IAttendanceFilter, IStudentAttendance } from '../interfaces/attendance.interface';
import { AttendanceSessionEntity } from '../entities/attendance-sessions.entity';

@Injectable()
export class AttendanceRepository extends Repository<AttendanceEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(AttendanceEntity, dataSource.createEntityManager());
  }

  async createAttendanceEntities(
    attendances: IStudentAttendance[],
    validStudentIds: number[],
    attendanceSession: AttendanceSessionEntity,
    queryRunner?: QueryRunner,
  ): Promise<AttendanceEntity[]> {
    const attendanceEntities: AttendanceEntity[] = attendances
      .filter((att) => validStudentIds.includes(Number(att.studentId)))
      .map((att) => {
        const attendance = new AttendanceEntity();
        attendance.studentId = att.studentId;
        attendance.attendanceSession = attendanceSession;
        attendance.status = att.status;
        attendance.note = att.note;
        attendance.attendance_date_time = new Date();
        return attendance;
      });

    if (queryRunner) {
      return await queryRunner.manager.save(AttendanceEntity, attendanceEntities);
    }

    return await this.save(attendanceEntities);
  }

  async getAttendancesWithFilters(
    userId: number,
    filters: IAttendanceFilter,
    page: number,
    take: number,
  ): Promise<[AttendanceEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Attendances).where('attendances.ownerId = :ownerId', { ownerId: userId });

    if (filters?.sort_order) {
      queryBuilder.orderBy('attendances.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findOwnedAttendancesByIds(attendanceIds: number[]): Promise<AttendanceEntity[]> {
    return this.find({
      where: { id: In(attendanceIds) },
    });
  }
}
