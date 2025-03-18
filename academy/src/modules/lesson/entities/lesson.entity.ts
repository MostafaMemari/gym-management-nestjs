import { Entity, Column } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.LESSONS)
export class LessonEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'text', nullable: true })
  content_html?: string;

  @Column('simple-array', { nullable: true })
  videos?: string[];

  @Column('simple-array', { nullable: true })
  documents?: string[];
}
