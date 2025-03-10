import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { AttendanceEntity } from './attendance.entity';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { SessionEntity } from '../../../modules/session/entities/session.entity';

@Entity(EntityName.AttendanceSessions)
export class AttendanceSessionEntity extends AbstractEntity {
  @Column({ type: 'integer', nullable: false })
  sessionId: number;

  @ManyToOne(() => SessionEntity, (session) => session.attendanceSessions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  session: SessionEntity;

  @Column({ type: 'date' })
  date: Date;

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.attendanceSession)
  attendances: AttendanceEntity[];
}
