import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.BELT_EXAM_RESULTS)
export class BeltExamResult extends AbstractEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  examId: number;

  @Column({ type: 'boolean' })
  passed: boolean;

  @Column({ type: 'text', nullable: true })
  feedback: string;
}
