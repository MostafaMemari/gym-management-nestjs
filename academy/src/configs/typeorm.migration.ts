import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get('DB_HOST') || 'academy_service_db',
  port: Number(configService.get('DB_PORT')) || 3306,
  username: configService.get('DB_USERNAME') || 'academy_service',
  password: configService.get('DB_PASSWORD') || '123456',
  database: configService.get('DB_NAME') || 'gym-academy',
  entities: [`./src/**/**/**/*.entity{.ts,.js}', './src/**/**/*.entity{.ts,.js}`],
  migrations: [`./src/migrations/*{.ts,.js}`],
  synchronize: false,
  migrationsTableName: 'gym_migration_db',
  logging: true,
});
