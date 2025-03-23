import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { LessonEntity } from '../entities/lesson.entity';
import { CachePatterns } from '../enums/cache.enum';

import { CacheService } from '../../cache/cache.service';

@Injectable()
export class LessonSubscriber implements EntitySubscriberInterface<LessonEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return LessonEntity;
  }

  async afterInsert(event: InsertEvent<LessonEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<LessonEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<LessonEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.LESSONS);
  }
}
