import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { CoachEntity } from '../../coach/entities/coach.entity';
import { DayOfWeek } from '../enums/days-of-week.enum';
import { StudentEntity } from 'src/modules/student/entities/student.entity';

@Entity(EntityName.Sessions)
export class SessionEntity extends AbstractEntity {
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

  @ManyToOne(() => CoachEntity, (coach) => coach.sessions, { nullable: false })
  @JoinColumn()
  coach: CoachEntity;

  @ManyToMany(() => StudentEntity, (student) => student.sessions)
  @JoinTable()
  students: StudentEntity[];

  // @OneToMany(() => AttendanceEntity, (attendance) => attendance.session)
  // attendances: AttendanceEntity[];
}
