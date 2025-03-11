import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { CachePatterns } from '../enums/cache.enum';

import { CacheService } from '../../../modules/cache/cache.service';

@Injectable()
export class StudentSubscriber implements EntitySubscriberInterface<StudentEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return StudentEntity;
  }

  async afterInsert(event: InsertEvent<StudentEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<StudentEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<StudentEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.STUDENTS);
  }
}
