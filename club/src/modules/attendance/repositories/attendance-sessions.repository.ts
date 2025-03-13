import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { ISearchAttendanceQuery } from '../interfaces/attendance.interface';
import { AttendanceSessionEntity } from '../entities/attendance-sessions.entity';

import { EntityName } from '../../../common/enums/entity.enum';

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
    filters: ISearchAttendanceQuery,
    page: number,
    take: number,
  ): Promise<[AttendanceSessionEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Attendances).where('attendances.ownerId = :ownerId', { ownerId: userId });

    if (filters?.search) {
      queryBuilder.andWhere('attendances.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('attendances.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findAttendanceByIdAndDate(sessionId: number, date: Date): Promise<AttendanceSessionEntity | null> {
    return this.findOne({ where: { id: sessionId, date } });
  }

  async findOwnedAttendancesByIds(attendanceIds: number[]): Promise<AttendanceSessionEntity[]> {
    return this.find({
      where: { id: In(attendanceIds) },
    });
  }
}
