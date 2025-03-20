import { TypeOrmModuleOptions, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const typeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => {
  const isProduction = configService.get<string>('NODE_ENV') === 'production';
  const isSslEnabled = !!Number(configService.get<string>('DB_SSL'));
  const isSynchronizeEnabled = !!Number(configService.get<string>('DB_SYNCHRONIZE'));

  return {
    type: 'mysql',
    host: configService.get<string>('DB_HOST'),
    port: Number(configService.get<number>('DB_PORT')),
    username: configService.get<string>('DB_USERNAME'),
    password: configService.get<string>('DB_PASSWORD'),
    database: configService.get<string>('DB_NAME'),
    autoLoadEntities: true,
    synchronize: isSynchronizeEnabled,
    ssl: (isProduction && isSslEnabled) || (!isProduction && isSslEnabled) ? { rejectUnauthorized: false } : null,
    // extra: isProduction || isSslEnabled ? { ssl: { rejectUnauthorized: false } } : null,
    cache: {
      type: 'redis',
      options: {
        host: configService.get<string>('REDIS_HOST', '127.0.0.1'),
        port: configService.get<number>('REDIS_PORT', 6379),
      },
      duration: 60000,
    },
  };
};

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: typeOrmConfig,
};
