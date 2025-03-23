import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../cache/cache.module';

import { LessonFileEntity } from './entities/lesson-files.entity';
import { LessonEntity } from './entities/lesson.entity';
import { UserLessonProgressEntity } from './entities/user-lesson-progress.entity';
import { LessonController } from './lesson.controller';
import { LessonService } from './lesson.service';
import { LessonRepository } from './repositories/lesson.repository';
import { LessonSubscriber } from './subscribers/lesson.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([LessonEntity, LessonFileEntity, UserLessonProgressEntity]), CacheModule],
  controllers: [LessonController],
  providers: [LessonService, LessonRepository, LessonSubscriber],
  exports: [LessonService],
})
export class LessonModule {}
