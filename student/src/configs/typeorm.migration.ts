import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: configService.get<string>('DB_HOST'),
  port: Number(configService.get<number>('DB_PORT')),
  username: configService.get<string>('DB_USERNAME'),
  password: configService.get<string>('DB_PASSWORD'),
  database: configService.get<string>('DB_NAME'),
  entities: [`./src/**/**/**/*.entity{.ts,.js}', './src/**/**/*.entity{.ts,.js}`],
  migrations: [`./src/migrations/*{.ts,.js}`],
  synchronize: false,
  migrationsTableName: 'gym_migration_db',
  logging: true,
});
