import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { ChapterEntity } from '../entities/chapter.entity';
import { CacheKeys } from '../enums/cache.enum';
import { ICreateChapter, ISearchChapterQuery, IUpdateChapter } from '../interfaces/chapter.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheTTLMilliseconds } from '../../../common/enums/cache-time';

@Injectable()
export class ChapterRepository extends Repository<ChapterEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ChapterEntity, dataSource.createEntityManager());
  }

  async createAndSaveChapter(createChapterDto: ICreateChapter): Promise<ChapterEntity> {
    const chapter = this.create({ ...createChapterDto });
    return await this.save(chapter);
  }

  async updateChapter(chapter: ChapterEntity, updateChapterDto: IUpdateChapter): Promise<ChapterEntity> {
    const updatedChapter = this.merge(chapter, { ...updateChapterDto });
    return await this.save(updatedChapter);
  }

  async getChaptersWithFilters(filters: ISearchChapterQuery, page: number, take: number): Promise<[ChapterEntity[], number]> {
    const cacheKey = `${CacheKeys.CHAPTERS}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.CHAPTERS);

    if (filters?.search) {
      queryBuilder.andWhere('chapters.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('chapters.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_CHAPTERS)
      .getManyAndCount();
  }
}
