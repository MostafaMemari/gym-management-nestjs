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
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  async afterUpdate(event: UpdateEvent<ClubEntity>) {
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  async afterRemove(event: RemoveEvent<ClubEntity>) {
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.CLUBS}:userId:${userId}*`);
  }
}
