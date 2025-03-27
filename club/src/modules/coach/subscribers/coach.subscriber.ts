import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CoachEntity } from '../entities/coach.entity';
import { CacheService } from '../../cache/cache.service';
import { CacheKeys } from 'src/common/enums/cache';

@Injectable()
export class CoachSubscriber implements EntitySubscriberInterface<CoachEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return CoachEntity;
  }

  async afterInsert(event: InsertEvent<CoachEntity>) {
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  async afterUpdate(event: UpdateEvent<CoachEntity>) {
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  async afterRemove(event: RemoveEvent<CoachEntity>) {
    const { ownerId } = event.entity;

    await this.clearCache(ownerId);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.COACHES}:userId:${userId}*`);
  }
}
