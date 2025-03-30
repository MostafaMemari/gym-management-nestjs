import { Column, Entity } from 'typeorm';

import { AgeCategoryName } from '../enums/age-category.enum';

import { BaseEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.AGE_CATEGORIES)
export class AgeCategoryEntity extends BaseEntity {
  @Column({ type: 'enum', enum: AgeCategoryName, unique: true })
  name: AgeCategoryName;

  @Column({ type: 'date' })
  start_date: Date;

  @Column({ type: 'date' })
  end_date: Date;
}
