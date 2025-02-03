import { Module } from '@nestjs/common';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';
import { RedisModule as NestjsRedisModule } from '@nestjs-modules/ioredis'
import redisConfig from './configs/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    NestjsRedisModule.forRoot(redisConfig())
  ],
  controllers: [RedisController],
  providers: [RedisService],
})
export class RedisModule { }
