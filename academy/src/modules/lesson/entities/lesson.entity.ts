import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { ChapterEntity } from 'src/modules/chapter/entities/chapter.entity';
import { UserLessonProgressEntity } from './user-lesson-progress.entity';
import { LessonFileEntity } from './lesson-files.entity';

@Entity(EntityName.LESSONS)
export class LessonEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ nullable: true })
  cover_image?: string;

  @Column({ nullable: true })
  video?: string;

  @Column()
  chapterId: number;

  @OneToMany(() => LessonFileEntity, (file) => file.lesson)
  files: LessonFileEntity[];

  @ManyToOne(() => ChapterEntity, (chapter) => chapter.lessons, { onDelete: 'CASCADE' })
  chapter: ChapterEntity;

  @OneToMany(() => UserLessonProgressEntity, (progress) => progress.lesson)
  userProgress: UserLessonProgressEntity[];
}
