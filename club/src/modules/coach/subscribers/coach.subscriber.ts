import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CacheService } from '../../../modules/cache/cache.service';
import { CoachEntity } from '../entities/coach.entity';
import { CachePatterns } from '../enums/cache.enum';

@Injectable()
export class CoachSubscriber implements EntitySubscriberInterface<CoachEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return CoachEntity;
  }

  async afterInsert(event: InsertEvent<CoachEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<CoachEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<CoachEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.COACHES);
  }
}
