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
    const { userId } = event.manager.queryRunner?.data;

    await this.clearCache(userId);
  }

  async afterUpdate(event: UpdateEvent<StudentEntity>) {
    const { userId } = event.manager.queryRunner?.data;

    await this.clearCache(userId);
  }

  async afterRemove(event: RemoveEvent<StudentEntity>) {
    const { userId } = event.manager.queryRunner?.data;

    await this.clearCache(userId);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS}`.replace(':userId', userId.toString()) + '*');
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS_SUMMARY}`.replace(':userId', userId.toString()) + '*');
  }
}
