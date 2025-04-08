import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { RedisModule } from '@nestjs-modules/ioredis';
import { redisConfig } from '../../configs/redis.config';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';

@Module({
  imports: [ConfigModule.forRoot(envConfig()), RedisModule.forRoot(redisConfig())],
  controllers: [],
  providers: [CacheService],
  exports: [CacheService, CacheModule],
})
export class CacheModule {}
