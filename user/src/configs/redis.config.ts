import { RedisModuleOptions } from '@nestjs-modules/ioredis';

export const redisConfig = (): RedisModuleOptions => {
  return {
    type: 'single',
    options: {
      host: process.env.REDIS_HOST,
      port: +process.env.REDIS_PORT,
      password: process.env.REDIS_PASSWORD,
    },
  };
};
