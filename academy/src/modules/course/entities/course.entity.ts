import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { ChapterEntity } from '../../chapter/entities/chapter.entity';

@Entity()
export class CourseEntity extends AbstractEntity {
  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  beltId: number;

  @Column({ nullable: true })
  cover_image?: string;

  @Column({ nullable: true })
  cover_video?: string;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.course)
  chapters: ChapterEntity[];
}
