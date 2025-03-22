import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { CourseEntity } from '../entities/course.entity';
import { CacheKeys } from '../enums/cache.enum';
import { ICreateCourse, ISearchCourseQuery, IUpdateCourse } from '../interfaces/course.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheTTLMilliseconds } from 'src/common/enums/cache-time';

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
}
