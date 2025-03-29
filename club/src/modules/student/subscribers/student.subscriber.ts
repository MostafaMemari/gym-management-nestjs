import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { CacheService } from '../../cache/cache.service';
import { CacheKeys } from '../../../common/enums/cache';

@Injectable()
export class StudentSubscriber implements EntitySubscriberInterface<StudentEntity> {
  constructor(@InjectDataSource() private readonly dataSource: DataSource, private readonly cacheService: CacheService) {
    this.dataSource.subscribers.push(this);
  }

  listenTo() {
    return StudentEntity;
  }

  async afterInsert(event: InsertEvent<StudentEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterUpdate(event: UpdateEvent<StudentEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  async afterRemove(event: RemoveEvent<StudentEntity>) {
    const { owner_id } = event.entity;

    await this.clearCache(owner_id);
  }

  private async clearCache(ownerId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS}`.replace(':userId', ownerId.toString()) + '*');
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS_SUMMARY}`.replace(':userId', ownerId.toString()) + '*');
  }
}
