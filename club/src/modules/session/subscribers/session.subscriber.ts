import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { SessionEntity } from '../entities/session.entity';
import { CachePatterns } from '../enums/cache.enum';

import { CacheService } from '../../cache/cache.service';

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
    await this.cacheService.delByPattern(CachePatterns.SESSION_LIST);
  }
}
