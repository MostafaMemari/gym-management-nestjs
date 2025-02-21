import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { CoachEntity } from '../../coach/entities/coach.entity';

@Entity(EntityName.Clubs)
export class ClubEntity extends AbstractEntity {
  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'set', enum: Gender })
  gender: Gender[];

  @Column({ type: 'varchar', length: 12, nullable: true })
  landline_number?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  address?: string;

  @Column({ type: 'integer', nullable: true })
  coachId: number;

  @ManyToOne(() => CoachEntity, (coach) => coach.student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  coach: CoachEntity;

  @ManyToOne(() => ClubEntity, (club) => club.student, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  student: ClubEntity;
}
