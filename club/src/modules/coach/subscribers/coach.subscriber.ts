import { EntitySubscriberInterface, EventSubscriber, InsertEvent, RemoveEvent, UpdateEvent } from 'typeorm';

import { CacheService } from '../../cache/cache.service';
import { CachePatterns } from '../../cache/enums/cache.enum';
import { CoachEntity } from '../entities/coach.entity';

@EventSubscriber()
export class CoachSubscriber implements EntitySubscriberInterface<CoachEntity> {
  constructor(private readonly cacheService: CacheService) {}

  listenTo() {
    return CoachEntity;
  }

  async afterInsert(event: InsertEvent<CoachEntity>) {
    await this.clearCache();
  }

  async afterUpdate(event: UpdateEvent<CoachEntity>) {
    await this.clearCache();
  }

  async afterRemove(event: RemoveEvent<CoachEntity>) {
    await this.clearCache();
  }

  private async clearCache() {
    await this.cacheService.delByPattern(CachePatterns.STUDENT_LIST);
  }
}
