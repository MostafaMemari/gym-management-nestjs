import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { CourseEntity } from '../entities/course.entity';
import { ICreateCourse, ISearchCourseQuery, IUpdateCourse } from '../interfaces/course.interface';

import { CacheTTLMilliseconds } from '../../../common/enums/cache';
import { EntityName } from '../../../common/enums/entity.enum';
import { CacheKeys } from '../../../common/enums/cache';

@Injectable()
export class CourseRepository extends Repository<CourseEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(CourseEntity, dataSource.createEntityManager());
  }

  async createAndSaveCourse(createCourseDto: ICreateCourse): Promise<CourseEntity> {
    const course = this.create({ ...createCourseDto });
    return await this.save(course);
  }

  async updateCourse(course: CourseEntity, updateCourseDto: IUpdateCourse): Promise<CourseEntity> {
    const updatedCourse = this.merge(course, { ...updateCourseDto });
    return await this.save(updatedCourse);
  }

  async getCoursesWithFilters(filters: ISearchCourseQuery, page: number, take: number): Promise<[CourseEntity[], number]> {
    const cacheKey = `${CacheKeys.COURSES}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.COURSES);

    if (filters?.search) {
      queryBuilder.andWhere('courses.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('courses.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_COURSES)
      .getManyAndCount();
  }

  async getCourseDetails(courseId: number): Promise<CourseEntity> {
    const cacheKey = `${CacheKeys.COURSE_DETAILS}-${courseId}`;

    const queryBuilder = this.createQueryBuilder(EntityName.COURSES)
      .where('courses.id = :courseId', { courseId })
      .leftJoinAndSelect('courses.chapters', 'chapters')
      .leftJoinAndSelect('chapters.lessons', 'lessons')
      .select(['courses.id', 'courses.title', 'chapters.id', 'chapters.title', 'lessons.id', 'lessons.title']);

    return queryBuilder.cache(cacheKey, CacheTTLMilliseconds.GET_COURSE_DETAILS).getOne();
  }
}
