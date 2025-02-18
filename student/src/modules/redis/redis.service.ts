// redis.service.ts
import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Redis } from 'ioredis';

@Injectable()
export class RedisCacheService implements OnModuleDestroy {
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

  onModuleDestroy() {
    this.redisClient.quit();
  }
}
