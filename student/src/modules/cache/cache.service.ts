import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheKeys } from './enums/cache.enum';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async set<T>(key: string, value: T, ttl: number = 30_000): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return await this.cacheManager.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    await this.cacheManager.clear();
  }

  async clearStudentCache(): Promise<void> {
    const store = (this.cacheManager as any).stores;

    console.log(store.key());

    if (store?.keys) {
      const keys = await store.keys(`${CacheKeys.STUDENT_LIST}-*`);
      if (keys.length > 0) {
        await store.del(keys);
      }
    }
  }
}
