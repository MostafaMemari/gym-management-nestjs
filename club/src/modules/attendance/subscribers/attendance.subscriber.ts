import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CachePatterns } from '../enums/cache.enum';
import { AttendanceEntity } from '../entities/attendance.entity';

import { CacheService } from '../../cache/cache.service';

@Injectable()
export class AttendanceSubscriber implements EntitySubscriberInterface<AttendanceEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return AttendanceEntity;
  }

  async afterInsert(event: InsertEvent<AttendanceEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<AttendanceEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<AttendanceEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.ATTENDANCES);
  }
}
