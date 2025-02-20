import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

const configService = new ConfigService();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: 'localhost',
  port: configService.get<number>('DB_PORT'),
  username: 'root',
  password: '6945',
  database: 'gym-students',
  entities: ['dist/**/**/**/*.entity{.ts,.js}', 'dist/**/**/*.entity{.ts,.js}'],
  migrations: ['dist/migrations/*{.ts,.js}'],
  synchronize: false,
  migrationsTableName: 'gym_migration_db',
  logging: true,
});
// export const AppDataSource = new DataSource({
//   type: 'mysql',
//   host: configService.get<string>('DB_HOST'),
//   port: configService.get<number>('DB_PORT'),
//   username: configService.get<string>('DB_USERNAME'),
//   password: configService.get<string>('DB_PASSWORD'),
//   database: configService.get<string>('DB_NAME'),
//   entities: ['dist/**/**/**/*.entity{.ts,.js}', 'dist/**/**/*.entity{.ts,.js}'],
//   migrations: ['dist/migrations/*{.ts,.js}'],
//   synchronize: false,
//   migrationsTableName: 'gym_migration_db',
//   logging: true,
// });

//* ایجاد Migration جدید بر اساس تغییرات Entity
// npm run migration:generate --name=CreateStudentsTable

//* اجرای Migrations
// npm run migration:run

//*  ایجاد Migration خالی
// npm run migration:create --name=CreateStudentsTable
