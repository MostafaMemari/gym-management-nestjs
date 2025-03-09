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

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'integer', nullable: true })
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
