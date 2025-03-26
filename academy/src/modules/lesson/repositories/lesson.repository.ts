import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { LessonEntity } from '../entities/lesson.entity';
import { CacheKeys } from '../enums/cache.enum';
import { ICreateLesson, ISearchLessonQuery, IUpdateLesson } from '../interfaces/lesson.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheTTLMilliseconds } from 'src/common/enums/cache-time';

@Injectable()
export class LessonRepository extends Repository<LessonEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(LessonEntity, dataSource.createEntityManager());
  }

  async createAndSaveLesson(createLessonDto: ICreateLesson): Promise<LessonEntity> {
    const lesson = this.create(createLessonDto);
    return await this.save(lesson);
  }

  async updateLesson(lesson: LessonEntity, updateLessonDto: IUpdateLesson): Promise<LessonEntity> {
    const updatedLesson = this.merge(lesson, { ...updateLessonDto });
    return await this.save(updatedLesson);
  }

  async getLessonsByChapter(chapterId: number): Promise<LessonEntity[]> {
    return this.find({ where: { chapterId } });
  }

  async getLessonsWithFilters(filters: ISearchLessonQuery, page: number, take: number): Promise<[LessonEntity[], number]> {
    const cacheKey = `${CacheKeys.LESSONS}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.LESSONS);

    if (filters?.search) {
      queryBuilder.andWhere('lessons.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('lessons.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_LESSONS)
      .getManyAndCount();
  }
}
