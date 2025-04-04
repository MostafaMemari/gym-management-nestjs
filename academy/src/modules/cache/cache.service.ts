import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService implements OnModuleDestroy {
  constructor(@Inject('REDIS_CLIENT') private readonly redisClient: Redis) {}

  async set(key: string, value: any, ttl: number = 30): Promise<void> {
    const data = JSON.stringify(value);
    if (ttl) {
      await this.redisClient.set(key, data, 'EX', ttl);
    } else {
      await this.redisClient.set(key, data);
    }
  }

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redisClient.get(key);
    return data ? JSON.parse(data) : null;
  }

  async del(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  async flush(): Promise<void> {
    await this.redisClient.flushdb();
  }

  async delByPattern(pattern: string): Promise<void> {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redisClient.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
      cursor = nextCursor;

      if (keys.length) {
        await this.redisClient.del(...keys);
      }
    } while (cursor !== '0');
  }

  onModuleDestroy() {
    this.redisClient.quit();
  }
}
