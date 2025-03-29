import { AfterLoad, Column, Entity, Index, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, OneToOne } from 'typeorm';

import { CoachEntity } from '../../coach/entities/coach.entity';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { GymEntity } from '../../gym/entities/gym.entity';
import { StudentBeltEntity } from './student-belt.entity';
import { SessionEntity } from '../../../modules/session/entities/session.entity';
import { AttendanceEntity } from '../../../modules/attendance/entities/attendance.entity';

@Entity(EntityName.STUDENTS)
@Index(['full_name', 'national_code'])
export class StudentEntity extends AbstractEntity {
  @Column({ type: 'integer', unique: true, nullable: false })
  user_id: number;

  @Column({ type: 'varchar', length: 80 })
  full_name: string;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender: Gender;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  father_name?: string;

  @Column({ type: 'varchar', length: 10, unique: true, nullable: true })
  national_code: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone_number?: string;

  @Column({ type: 'varchar', length: 12, nullable: true })
  landline_number?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'int', nullable: true })
  membership_year?: number;

  @Column({ type: 'date', nullable: true })
  birth_date: Date;

  @Column({ type: 'date', nullable: true })
  sports_insurance_date?: Date;

  @Column({ type: 'date', nullable: true })
  expire_image_date?: Date;

  @Column({ type: 'integer', nullable: false })
  gym_id: number;

  @Column({ type: 'integer', nullable: true })
  coach_id: number;

  @Column({ type: 'integer', nullable: false })
  owner_id: number;

  @ManyToOne(() => GymEntity, (gym) => gym.students, { nullable: false })
  @JoinColumn({ name: 'gym_id', referencedColumnName: 'id' })
  gym: GymEntity | null;

  @ManyToOne(() => CoachEntity, (coach) => coach.students, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'coach_id', referencedColumnName: 'id' })
  coach: CoachEntity | null;

  @OneToOne(() => StudentBeltEntity, (beltInfo) => beltInfo.student, { nullable: true })
  beltInfo: StudentBeltEntity | null;

  @ManyToMany(() => SessionEntity, (session) => session.students)
  @JoinTable()
  sessions: SessionEntity[];

  @OneToMany(() => AttendanceEntity, (attendance) => attendance.student)
  attendances: AttendanceEntity;

  @AfterLoad()
  map() {
    if (this.image_url) {
      this.image_url = `https://node-bucket.storage.c2.liara.space/${this.image_url}`;
    } else {
      this.image_url = null;
    }
  }
}
