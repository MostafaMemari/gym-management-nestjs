import { Column, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { CoachEntity } from '../../coach/entities/coach.entity';
import { StudentEntity } from 'src/modules/student/entities/student.entity';

@Entity(EntityName.Clubs)
export class ClubEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'set', enum: Gender })
  genders: Gender[];

  @Column({ type: 'varchar', length: 12, nullable: true })
  landline_number?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'integer', nullable: false })
  ownerId: number;

  @ManyToMany(() => CoachEntity, (coach) => coach.clubs)
  @JoinTable()
  coaches: CoachEntity[];

  @OneToMany(() => StudentEntity, (student) => student.club)
  students: StudentEntity[];
}
