import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { LessonEntity } from '../../../modules/lesson/entities/lesson.entity';
import { CourseEntity } from '../../course/entities/course.entity';

@Entity()
export class ChapterEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @ManyToOne(() => CourseEntity, (course) => course.chapters)
  course: CourseEntity;

  @OneToMany(() => LessonEntity, (lesson) => lesson.chapter)
  lessons: LessonEntity[];
}
