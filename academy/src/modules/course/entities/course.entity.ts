import { Column, Entity, OneToMany } from 'typeorm';

import { AbstractEntity } from '../../../common/abstracts/abstract.entity';
import { ChapterEntity } from '../../chapter/entities/chapter.entity';
import { EntityName } from 'src/common/enums/entity.enum';

@Entity(EntityName.COURSES)
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
  intro_video?: string;

  @OneToMany(() => ChapterEntity, (chapter) => chapter.course)
  chapters: ChapterEntity[];
}
