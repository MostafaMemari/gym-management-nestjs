import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CourseService } from './course.service';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ICreateCourse, ISearchCourseQuery, IUpdateCourse } from './interfaces/course.interface';
import { CoursePatterns } from './patterns/course.pattern';

@Controller()
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @MessagePattern(CoursePatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(CoursePatterns.CREATE)
  create(@Payload() data: { createCourseDto: ICreateCourse }): Promise<ServiceResponse> {
    const { createCourseDto } = data;

    return this.courseService.create(createCourseDto);
  }
  @MessagePattern(CoursePatterns.UPDATE)
  update(@Payload() data: { courseId: number; updateCourseDto: IUpdateCourse }): Promise<ServiceResponse> {
    const { courseId, updateCourseDto } = data;

    return this.courseService.update(courseId, updateCourseDto);
  }
  @MessagePattern(CoursePatterns.GET_ALL)
  findAll(@Payload() data: { queryCourseDto: ISearchCourseQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { queryCourseDto, paginationDto } = data;

    return this.courseService.getAll({ queryCourseDto, paginationDto });
  }
  @MessagePattern(CoursePatterns.GET_ALL_DETAILS)
  findAllDetails(@Payload() data: { queryCourseDto: ISearchCourseQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { queryCourseDto, paginationDto } = data;

    return this.courseService.getAllDetails({ queryCourseDto, paginationDto });
  }
  @MessagePattern(CoursePatterns.GET_ONE)
  findOne(@Payload() data: { courseId: number }): Promise<ServiceResponse> {
    const { courseId } = data;

    return this.courseService.findOneById(courseId);
  }
  @MessagePattern(CoursePatterns.REMOVE)
  remove(@Payload() data: { courseId: number }): Promise<ServiceResponse> {
    const { courseId } = data;

    return this.courseService.removeById(courseId);
  }
}
