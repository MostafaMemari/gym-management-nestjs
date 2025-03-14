import { TypeOrmModuleOptions, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClubSubscriber } from '../modules/club/subscribers/club.subscriber';
import { CoachSubscriber } from '../modules/coach/subscribers/coach.subscriber';
import { StudentSubscriber } from '../modules/student/subscribers/student.subscriber';

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
  };
};

export const typeOrmConfigAsync: TypeOrmModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: typeOrmConfig,
};
