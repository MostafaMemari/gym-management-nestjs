import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { CacheService } from '../../cache/cache.service';
import { CacheKeys } from 'src/common/enums/cache';

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
    console.log('insert', userId);
    await this.clearCache(userId);
  }

  async afterUpdate(event: UpdateEvent<StudentEntity>) {
    const { userId } = event.manager.queryRunner?.data;
    console.log('update', userId);
    await this.clearCache(userId);
  }

  async afterRemove(event: RemoveEvent<StudentEntity>) {
    const { userId } = event.manager.queryRunner?.data;
    console.log('remove', userId);
    await this.clearCache(userId);
  }

  private async clearCache(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS}-userId:${userId}*`);
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS_SUMMARY}-userId:${userId}*`);
  }
}
