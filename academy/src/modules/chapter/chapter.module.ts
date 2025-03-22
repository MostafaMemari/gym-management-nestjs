import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChapterEntity } from './entities/chapter.entity';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { ChapterRepository } from './repositories/chapter.repository';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterEntity]), CourseModule],
  controllers: [ChapterController],
  providers: [ChapterService, ChapterRepository],
  exports: [ChapterService],
})
export class ChapterModule {}
