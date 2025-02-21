import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configModuleOptions from './common/validation/env.validation';
import { typeOrmConfigAsync } from './configs/typeorm.config';
import { CoachModule } from './modules/coaches/coach.module';
import { StudentModule } from './modules/students/student.module';

@Module({
  imports: [ConfigModule.forRoot(configModuleOptions()), TypeOrmModule.forRootAsync(typeOrmConfigAsync), StudentModule, CoachModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
