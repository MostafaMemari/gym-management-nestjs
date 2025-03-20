import { Column, Entity, ManyToOne } from 'typeorm';
import { LessonEntity } from './lesson.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { AbstractEntity } from '../../../common/abstracts/abstract.entity';

@Entity(EntityName.LESSON_FILES)
export class LessonFileEntity extends AbstractEntity {
  @Column()
  type: 'video' | 'document';

  @Column()
  filename: string;

  @Column()
  file_path: string;

  @ManyToOne(() => LessonEntity, (lesson) => lesson.files)
  lesson: LessonEntity;
}
