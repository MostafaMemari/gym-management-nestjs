import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configModuleOptions from './common/validation/env.validation';
import { typeOrmConfigAsync } from './configs/typeorm.config';
import { CourseModule } from './modules/course/course.module';
import { ChapterModule } from './modules/chapter/chapter.module';
import { LessonModule } from './modules/lesson/lesson.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions()),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    CourseModule,
    ChapterModule,
    LessonModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
