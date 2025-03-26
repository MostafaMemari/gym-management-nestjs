import { Injectable, NotFoundException } from '@nestjs/common';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CourseEntity } from './entities/course.entity';
import { CourseMessages } from './enums/course.message';
import { ICreateCourse, ISearchCourseQuery, IUpdateCourse } from './interfaces/course.interface';
import { CourseRepository } from './repositories/course.repository';

@Injectable()
export class CourseService {
  constructor(private readonly courseRepository: CourseRepository) {}

  async create(createCourseDto: ICreateCourse) {
    try {
      const course = await this.courseRepository.createAndSaveCourse({ ...createCourseDto });

      return ResponseUtil.success(course, CourseMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(courseId: number, updateCourseDto: IUpdateCourse): Promise<ServiceResponse> {
    try {
      const course = await this.validateById(courseId);

      const updatedCourse = await this.courseRepository.updateCourse(course, updateCourseDto);

      return ResponseUtil.success(updatedCourse, CourseMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryCourseDto: ISearchCourseQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [courses, count] = await this.courseRepository.getCoursesWithFilters(query.queryCourseDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(courses, pageMetaDto);

      return ResponseUtil.success(result.data, CourseMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneDetail(courseId: number): Promise<ServiceResponse> {
    try {
      const course = await this.courseRepository.getCourseDetails(courseId);

      return ResponseUtil.success(course, CourseMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(courseId: number): Promise<ServiceResponse> {
    try {
      const course = await this.validateById(courseId);

      return ResponseUtil.success(course, CourseMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(courseId: number): Promise<ServiceResponse> {
    try {
      const removedCourse = await this.courseRepository.delete({ id: courseId });

      if (!removedCourse.affected) ResponseUtil.error(CourseMessages.REMOVE_FAILURE);

      return ResponseUtil.success(removedCourse, CourseMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async validateById(courseId: number): Promise<CourseEntity> {
    const course = await this.courseRepository.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException(CourseMessages.NOT_FOUND);
    return course;
  }
}
