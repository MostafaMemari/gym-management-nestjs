import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { CachePatterns } from '../enums/cache.enum';

import { BeltExamEntity } from '../entities/belt-exam.entity';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class BeltExamSubscriber implements EntitySubscriberInterface<BeltExamEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return BeltExamEntity;
  }

  async afterInsert(event: InsertEvent<BeltExamEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<BeltExamEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<BeltExamEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.BELT_EXAMS);
  }
}
