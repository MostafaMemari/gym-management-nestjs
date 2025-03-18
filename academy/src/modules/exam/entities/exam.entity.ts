import { Entity, Column, CreateDateColumn } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.BELT_EXAMS)
export class BeltExam extends AbstractEntity {
  @Column()
  title: string;

  @Column()
  beltId: number;

  @Column({ type: 'date' })
  examDate: Date;

  @CreateDateColumn()
  createdAt: Date;
}
