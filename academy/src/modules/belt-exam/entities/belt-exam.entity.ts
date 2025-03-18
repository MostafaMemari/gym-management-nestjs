import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { BeltEntity } from '../../../modules/belt/entities/belt.entity';

@Entity(EntityName.BELT_EXAMS)
export class BeltExamEntity extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  description: string;

  @Column({ type: 'set', enum: Gender })
  genders: Gender[];

  @Column({ type: 'simple-array' })
  event_places: string[];

  // @Column('text', { array: true })
  // event_places: string[];

  @Column({ type: 'date' })
  event_date: Date;

  @Column({ type: 'date' })
  register_date: Date;

  @ManyToMany(() => BeltEntity)
  @JoinTable({
    name: 'belt_exams_belts',
    joinColumn: {
      name: 'beltExamEntityId',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'beltEntityId',
      referencedColumnName: 'id',
    },
  })
  belts: BeltEntity[];
}
