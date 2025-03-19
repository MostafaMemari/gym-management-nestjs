import { Entity, ManyToOne, Column } from 'typeorm';

import { LessonEntity } from './lesson.entity';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.USER_LESSON_PROGRESS)
export class UserLessonProgressEntity extends AbstractEntity {
  @Column()
  userId: number;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.userProgress)
  lesson: LessonEntity;

  @Column({ default: false })
  is_completed: boolean;
}
