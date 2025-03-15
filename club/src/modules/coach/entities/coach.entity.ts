import { Column, Entity, Index, ManyToMany, OneToMany } from 'typeorm';

import { StudentEntity } from '../../student/entities/student.entity';

import { SessionEntity } from '../../../modules/session/entities/session.entity';
import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { ClubEntity } from '../../../modules/club/entities/club.entity';
import { AttendanceSessionEntity } from 'src/modules/attendance/entities/attendance-sessions.entity';

@Entity(EntityName.Coaches)
@Index(['full_name', 'national_code'])
export class CoachEntity extends AbstractEntity {
  @Column({ type: 'integer', unique: true, nullable: false })
  userId: Number;

  @Column({ type: 'varchar', length: 80 })
  full_name: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;

  @Column({ type: 'varchar', nullable: true })
  image_url?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  father_name?: string;

  @Column({ type: 'varchar', length: 10, unique: true })
  national_code: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phone_number?: string;

  @Column({ type: 'timestamp', nullable: true })
  birth_date: Date;

  @Column({ type: 'integer', nullable: false })
  ownerId: number;

  @OneToMany(() => StudentEntity, (student) => student.coach)
  students: StudentEntity[];

  @ManyToMany(() => ClubEntity, (club) => club.coaches)
  clubs: ClubEntity[];

  @OneToMany(() => SessionEntity, (session) => session.coach)
  sessions: SessionEntity;

  @OneToMany(() => AttendanceSessionEntity, (attendanceSession) => attendanceSession.coach)
  attendanceSessions: AttendanceSessionEntity[];
}
