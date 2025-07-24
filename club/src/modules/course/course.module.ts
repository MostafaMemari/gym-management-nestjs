import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../cache/cache.module';

import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseEntity } from './entities/course.entity';
import { CourseRepository } from './repositories/course.repository';
import { CourseSubscriber } from './subscribers/course.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity]), CacheModule],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository, CourseSubscriber],
  exports: [CourseService],
})
export class CourseModule {}
