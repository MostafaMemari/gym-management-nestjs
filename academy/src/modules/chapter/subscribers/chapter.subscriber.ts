import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { ChapterEntity } from '../entities/chapter.entity';

import { CacheService } from '../../../modules/cache/cache.service';
import { CachePatterns } from '../../../common/enums/cache';

@Injectable()
export class ChapterSubscriber implements EntitySubscriberInterface<ChapterEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return ChapterEntity;
  }

  async afterInsert(event: InsertEvent<ChapterEntity>) {
    const { courseId } = event.entity;

    await this.clearCache(courseId);
  }

  async afterUpdate(event: UpdateEvent<ChapterEntity>) {
    const { courseId } = event.entity;

    await this.clearCache(courseId);
  }

  async afterRemove(event: RemoveEvent<ChapterEntity>) {
    const { courseId } = event.entity;

    await this.clearCache(courseId);
  }

  private async clearCache(courseId: number = null) {
    await this.cacheService.delByPattern(CachePatterns.CHAPTERS);
    await this.cacheService.delByPattern(CachePatterns.COURSE_DETAILS_BY_ID.replace('{courseId}', courseId.toString()));
  }
}
