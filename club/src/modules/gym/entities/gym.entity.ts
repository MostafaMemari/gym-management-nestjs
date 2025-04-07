import { Column, Entity, JoinTable, ManyToMany, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { CoachEntity } from '../../coach/entities/coach.entity';
import { StudentEntity } from '../../student/entities/student.entity';
import { SessionEntity } from '../../session/entities/session.entity';
import { on } from 'events';

@Entity(EntityName.GYMS)
export class GymEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'boolean', default: true })
  is_wallet_depleted: boolean;

  @Column({ type: 'set', enum: Gender })
  genders: Gender[];

  @Column({ type: 'varchar', length: 12, nullable: true })
  landline_number?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'integer', nullable: false })
  admin_id: number;

  @ManyToMany(() => CoachEntity, (coach) => coach.gyms)
  @JoinTable({
    name: 'gym_coaches',
    joinColumn: { name: 'gym_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'coach_id', referencedColumnName: 'id' },
  })
  coaches: CoachEntity[];

  @OneToMany(() => StudentEntity, (student) => student.gym)
  students: StudentEntity[];

  @OneToMany(() => SessionEntity, (session) => session.gym)
  sessions: SessionEntity[];
}
