import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { CoachEntity } from '../../coach/entities/coach.entity';
import { DayOfWeek } from '../enums/days-of-week.enum';
import { StudentEntity } from '../../../modules/student/entities/student.entity';
import { GymEntity } from '../../gym/entities/gym.entity';
import { AttendanceSessionEntity } from '../../../modules/attendance/entities/attendance-sessions.entity';

@Entity(EntityName.SESSIONS)
export class SessionEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'set', enum: DayOfWeek })
  days: DayOfWeek[];

  @Column({ type: 'time', nullable: true })
  start_time: string;

  @Column({ type: 'time', nullable: true })
  end_time: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  description?: string;

  @Column({ type: 'integer', nullable: false })
  coachId: number;

  @Column({ type: 'integer', nullable: false })
  gymId: number;

  @ManyToOne(() => CoachEntity, (coach) => coach.sessions, { nullable: false })
  @JoinColumn()
  coach: CoachEntity;

  @ManyToMany(() => StudentEntity, (student) => student.sessions, { onDelete: 'CASCADE' })
  students: StudentEntity[];

  @ManyToOne(() => GymEntity, (gym) => gym.sessions, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn()
  gym: GymEntity;

  @OneToMany(() => AttendanceSessionEntity, (attendanceSession) => attendanceSession.session)
  attendanceSessions: AttendanceSessionEntity[];
}
