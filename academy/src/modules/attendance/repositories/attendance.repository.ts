import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { AttendanceEntity } from '../entities/attendance.entity';
import { IStudentAttendance } from '../interfaces/attendance.interface';
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
    const attendanceEntities: AttendanceEntity[] = attendances.map((att) => {
      const attendance = new AttendanceEntity();
      attendance.studentId = att.studentId;
      attendance.attendanceSession = attendanceSession;
      attendance.status = att.status;
      attendance.note = att.note;
      attendance.attendance_date_time = new Date();
      attendance.is_guest = !validStudentIds.includes(Number(att.studentId));
      return attendance;
    });

    if (queryRunner) {
      return await queryRunner.manager.save(AttendanceEntity, attendanceEntities);
    }

    return await this.save(attendanceEntities);
  }

  async deleteAttendanceBySession(sessionId: number, queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.delete(AttendanceEntity, { attendanceSession: { id: sessionId } });
  }
}
