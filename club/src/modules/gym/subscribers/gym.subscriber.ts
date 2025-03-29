import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { GymEntity } from '../entities/gym.entity';
import { CacheService } from '../../cache/cache.service';
import { CacheKeys } from 'src/common/enums/cache';

@Injectable()
export class GymSubscriber implements EntitySubscriberInterface<GymEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return GymEntity;
  }

  async afterInsert(event: InsertEvent<GymEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterUpdate(event: UpdateEvent<GymEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterRemove(event: RemoveEvent<GymEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  private async clearCache(ownerId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.GYMS}`.replace(':userId', ownerId.toString()) + '*');
  }
}
