import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { CacheService } from '../../cache/cache.service';
import { CachePatterns } from '../../../common/enums/cache.enum';

@EventSubscriber()
export class StudentSubscriber implements EntitySubscriberInterface<StudentEntity> {
  constructor(private readonly cacheService: CacheService) {}

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
    await this.cacheService.delByPattern(CachePatterns.STUDENT_LIST);
  }
}
