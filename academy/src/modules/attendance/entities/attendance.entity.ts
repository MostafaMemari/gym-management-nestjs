import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AttendanceSessionEntity } from './attendance-sessions.entity';

import { AttendanceStatus } from '../enums/attendance.status.enum';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { StudentEntity } from '../../../modules/student/entities/student.entity';

@Entity(EntityName.Attendances)
export class AttendanceEntity extends AbstractEntity {
  @Column({ type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  attendance_date_time: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  note?: string;

  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status: AttendanceStatus;

  @Column({ type: 'boolean', default: false })
  is_guest: boolean;

  @Column({ type: 'integer', nullable: false })
  studentId: number;

  @Column({ type: 'integer', nullable: false })
  attendanceSessionId: number;

  @ManyToOne(() => AttendanceSessionEntity, (attendanceSession) => attendanceSession.attendances, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  attendanceSession: AttendanceSessionEntity;

  @ManyToOne(() => StudentEntity, (student) => student.attendances, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  student: StudentEntity;
}
