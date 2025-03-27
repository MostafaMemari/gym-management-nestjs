import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { ClubEntity } from '../entities/club.entity';
import { CacheService } from '../../cache/cache.service';
import { CacheKeys } from 'src/common/enums/cache';

@Injectable()
export class ClubSubscriber implements EntitySubscriberInterface<ClubEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return ClubEntity;
  }

  async afterInsert(event: InsertEvent<ClubEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterUpdate(event: UpdateEvent<ClubEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterRemove(event: RemoveEvent<ClubEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.CLUBS}`.replace(':userId', userId.toString()) + '*');
  }
}
