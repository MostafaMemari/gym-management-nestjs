import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ChapterEntity } from './entities/chapter.entity';
import { ChapterController } from './chapter.controller';
import { ChapterService } from './chapter.service';
import { ChapterRepository } from './repositories/chapter.repository';
import { CourseModule } from '../course/course.module';
import { CacheModule } from '../cache/cache.module';
import { ChapterSubscriber } from './subscribers/chapter.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([ChapterEntity]), CourseModule, CacheModule],
  controllers: [ChapterController],
  providers: [ChapterService, ChapterRepository, ChapterSubscriber],
  exports: [ChapterService],
})
export class ChapterModule {}
