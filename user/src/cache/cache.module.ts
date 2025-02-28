import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { redisConfig } from '../configs/redis.config';

@Module({
  imports: [RedisModule.forRoot(redisConfig())],
  controllers: [],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheModule {}
