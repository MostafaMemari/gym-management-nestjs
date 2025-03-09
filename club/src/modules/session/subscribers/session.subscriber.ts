import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CacheService } from '../../cache/cache.service';

import { CachePatterns } from '../../../common/enums/cache.enum';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class SessionSubscriber implements EntitySubscriberInterface<SessionEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return SessionEntity;
  }

  async afterInsert(event: InsertEvent<SessionEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<SessionEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<SessionEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.CLUB_LIST);
  }
}
