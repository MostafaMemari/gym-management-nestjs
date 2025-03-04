import { Column, Entity, JoinTable, ManyToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { BeltEntity } from '../../../modules/belt/entities/belt.entity';

@Entity(EntityName.BeltExams)
export class BeltExamEntity extends AbstractEntity {
  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'set', enum: Gender })
  genders: Gender[];

  @Column({ type: 'date' })
  event_date: Date;

  @Column({ type: 'date' })
  register_date: Date;

  @ManyToMany(() => BeltEntity)
  @JoinTable()
  belts: BeltEntity[];
}
