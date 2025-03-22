import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CourseEntity } from './entities/course.entity';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';
import { CourseRepository } from './repositories/course.repository';

@Module({
  imports: [TypeOrmModule.forFeature([CourseEntity])],
  controllers: [CourseController],
  providers: [CourseService, CourseRepository],
  exports: [CourseService],
})
export class CourseModule {}
