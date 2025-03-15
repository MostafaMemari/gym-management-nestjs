import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CachePatterns } from '../enums/cache.enum';
import { AttendanceSessionEntity } from '../entities/attendance-sessions.entity';

import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AttendanceSubscriber implements EntitySubscriberInterface<AttendanceSessionEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return AttendanceSessionEntity;
  }

  async afterInsert(event: InsertEvent<AttendanceSessionEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<AttendanceSessionEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<AttendanceSessionEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.ATTENDANCES);
  }
}
