import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { AgeCategoryEntity } from '../entities/age-category.entity';
import { CachePatterns } from '../enums/cache.enum';

import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AgeCategorySubscriber implements EntitySubscriberInterface<AgeCategoryEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return AgeCategoryEntity;
  }

  async afterInsert(event: InsertEvent<AgeCategoryEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<AgeCategoryEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<AgeCategoryEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.AGE_CATEGORIES);
  }
}
