import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { AttendanceEntity } from '../entities/attendance.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { ISearchAttendanceQuery } from '../interfaces/attendance.interface';

@Injectable()
export class AttendanceRepository extends Repository<AttendanceEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(AttendanceEntity, dataSource.createEntityManager());
  }

  // async createAndSaveAttendance(createAttendanceDto: IRecordAttendance): Promise<AttendanceEntity> {
  //   const attendance = this.create({ ...createAttendanceDto });
  //   return await this.save(attendance);
  // }

  // async updateAttendance(attendance: AttendanceEntity, updateAttendanceDto: IUpdateAttendance): Promise<AttendanceEntity> {
  //   const updatedAttendance = this.merge(attendance, { ...updateAttendanceDto });
  //   return await this.save(updatedAttendance);
  // }

  async getAttendancesWithFilters(
    userId: number,
    filters: ISearchAttendanceQuery,
    page: number,
    take: number,
  ): Promise<[AttendanceEntity[], number]> {
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

  async findByIdAndOwner(attendanceId: number): Promise<AttendanceEntity | null> {
    return this.findOne({ where: { id: attendanceId } });
  }

  async findOwnedAttendancesByIds(attendanceIds: number[]): Promise<AttendanceEntity[]> {
    return this.find({
      where: { id: In(attendanceIds) },
    });
  }
}
