import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { LessonEntity } from '../../../modules/lesson/entities/lesson.entity';
import { CourseEntity } from '../../course/entities/course.entity';
import { EntityName } from '../../../common/enums/entity.enum';

@Entity(EntityName.CHAPTERS)
export class ChapterEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  courseId: number;

  @ManyToOne(() => CourseEntity, (course) => course.chapters, { onDelete: 'CASCADE' })
  course: CourseEntity;

  @OneToMany(() => LessonEntity, (lesson) => lesson.chapter)
  lessons: LessonEntity[];
}
