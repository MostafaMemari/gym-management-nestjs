import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CachePatterns } from '../enums/cache.enum';

import { ClubEntity } from '../entities/club.entity';
import { CacheService } from '../../../modules/cache/cache.service';

@Injectable()
export class ClubSubscriber implements EntitySubscriberInterface<ClubEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return ClubEntity;
  }

  async afterInsert(event: InsertEvent<ClubEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<ClubEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<ClubEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.CLUB_LIST);
  }
}
