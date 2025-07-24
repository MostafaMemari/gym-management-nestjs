import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { CourseEntity } from '../entities/course.entity';
import { CacheService } from '../../cache/cache.service';

import { CachePatterns } from '../../../common/enums/cache';

@Injectable()
export class CourseSubscriber implements EntitySubscriberInterface<CourseEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return CourseEntity;
  }

  async afterInsert(event: InsertEvent<CourseEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<CourseEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<CourseEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.COURSES);
    await this.cacheService.delByPattern(CachePatterns.CHAPTERS);
    await this.cacheService.delByPattern(CachePatterns.LESSONS);
  }
}
