import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CourseEntity } from './entities/course.entity';
import { CourseMessages } from './enums/course.message';
import { ICreateCourse, ISearchCourseQuery, IUpdateCourse } from './interfaces/course.interface';
import { CourseRepository } from './repositories/course.repository';
import { checkConnection } from 'src/common/utils/checkConnection.utils';
import { ClubPatterns } from './enums/patterns.events';
import { lastValueFrom, timeout } from 'rxjs';

@Injectable()
export class CourseService {
  constructor(
    @Inject(Services.CLUB) private readonly clubServiceClientProxy: ClientProxy,
    private readonly courseRepository: CourseRepository,
  ) {}

  async create(createCourseDto: ICreateCourse) {
    const { beltIds, image_cover_key, intro_video_key } = createCourseDto;

    try {
      await this.validateBeltIds(beltIds);
      const course = await this.courseRepository.createAndSaveCourse({
        ...createCourseDto,
        cover_image: image_cover_key,
        intro_video: intro_video_key,
      });

      return ResponseUtil.success(course, CourseMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(courseId: number, updateCourseDto: IUpdateCourse): Promise<ServiceResponse> {
    try {
      const course = await this.validateById(courseId);

      return ResponseUtil.success({}, CourseMessages.UPDATE_FAILURE);
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
      await this.validateById(courseId);

      const removedCourse = await this.courseRepository.delete({ id: courseId });

      if (!removedCourse.affected) ResponseUtil.error(CourseMessages.REMOVE_FAILURE);

      return ResponseUtil.success(removedCourse, CourseMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || CourseMessages.REMOVE_FAILURE, error?.status);
    }
  }

  private async validateById(courseId: number): Promise<CourseEntity> {
    const course = await this.courseRepository.findOneBy({ id: courseId });
    if (!course) throw new NotFoundException(CourseMessages.NOT_FOUND);
    return course;
  }

  private async validateBeltIds(beltIds: number[]) {
    await checkConnection(Services.CLUB, this.clubServiceClientProxy, { pattern: ClubPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(this.clubServiceClientProxy.send(ClubPatterns.GET_BELT_BY_IDS, { beltIds }).pipe(timeout(5000)));

    console.log(result);
    if (result?.error) throw result;
  }
}
