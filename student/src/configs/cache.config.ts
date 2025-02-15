import { createKeyv } from '@keyv/redis';
import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export const cacheConfig = (configService: ConfigService): CacheModuleOptions => {
  return {
    isGlobal: true,
    stores: [
      createKeyv({
        password: configService.get<string>('REDIS_PASSWORD'),
        socket: {
          host: configService.get<string>('REDIS_HOST'),
          port: configService.get<number>('REDIS_PORT'),
        },
      }),
    ],
  };
};
