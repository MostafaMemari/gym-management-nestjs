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
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterUpdate(event: UpdateEvent<CoachEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterRemove(event: RemoveEvent<CoachEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.COACHES}`.replace(':userId', userId.toString()) + '*');
  }
}
