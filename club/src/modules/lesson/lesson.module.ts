import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../cache/cache.module';

import { LessonFileEntity } from './entities/lesson-files.entity';
import { LessonEntity } from './entities/lesson.entity';
import { UserLessonProgressEntity } from './entities/user-lesson-progress.entity';
import { LessonController } from './lesson.controller';
import { LessonService } from './services/lesson.service';
import { LessonRepository } from './repositories/lesson.repository';
import { LessonSubscriber } from './subscribers/lesson.subscriber';
import { UserLessonProgressService } from './services/user-lesson-progress.service';
import { UserLessonProgressRepository } from './repositories/user-lesson-progress.repository';

@Module({
  imports: [TypeOrmModule.forFeature([LessonEntity, LessonFileEntity, UserLessonProgressEntity]), CacheModule],
  controllers: [LessonController],
  providers: [LessonService, LessonRepository, UserLessonProgressService, UserLessonProgressRepository, LessonSubscriber],
  exports: [LessonService],
})
export class LessonModule {}
