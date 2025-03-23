import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { ChapterEntity } from '../entities/chapter.entity';
import { CachePatterns } from '../enums/cache.enum';
import { CacheService } from '../../../modules/cache/cache.service';

@Injectable()
export class ChapterSubscriber implements EntitySubscriberInterface<ChapterEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return ChapterEntity;
  }

  async afterInsert(event: InsertEvent<ChapterEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<ChapterEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<ChapterEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.CHAPTERS);
  }
}
