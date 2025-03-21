import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { LessonEntity } from './entities/lesson.entity';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonRepository } from './repositories/lesson.repository';
import { LessonFileEntity } from './entities/lesson-files.entity';
import { UserLessonProgressEntity } from './entities/user-lesson-progress.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LessonEntity, LessonFileEntity, UserLessonProgressEntity])],
  controllers: [LessonController],
  providers: [LessonService, LessonRepository],
  exports: [LessonService],
})
export class LessonModule {}
