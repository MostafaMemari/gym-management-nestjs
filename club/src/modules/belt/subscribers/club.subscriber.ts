import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { BeltEntity } from '../entities/belt.entity';
import { CacheService } from '../../cache/cache.service';
import { CachePatterns } from '../enums/cache.enum';

@Injectable()
export class BeltSubscriber implements EntitySubscriberInterface<BeltEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return BeltEntity;
  }

  async afterInsert(event: InsertEvent<BeltEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<BeltEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<BeltEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.BELT_LIST);
  }
}
