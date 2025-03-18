import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

export const createRedisClient = (configService: ConfigService): Redis => {
  return new Redis({
    host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
    port: configService.get<number>('REDIS_PORT', 6379),
    password: configService.get<string>('REDIS_PASSWORD', undefined),
    db: configService.get<number>('REDIS_DB', 0),
  });
};
