import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { LessonMessages } from './enums/lesson.message';
import { LessonRepository } from './repositories/lesson.repository';
import { ICreateLesson, ISearchLessonQuery, IUpdateLesson } from './interfaces/lesson.interface';
import { LessonEntity } from './entities/lesson.entity';

@Injectable()
export class LessonService {
  constructor(private readonly lessonRepository: LessonRepository) {}

  async create(createLessonDto: ICreateLesson): Promise<ServiceResponse> {
    try {
      //   const lesson = await this.lessonRepository.createAndSaveLesson(createLessonDto);

      return ResponseUtil.success({}, LessonMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(lessonId: number, updateLessonDto: IUpdateLesson): Promise<ServiceResponse> {
    try {
      const lesson = await this.validateById(lessonId);

      return ResponseUtil.success({}, LessonMessages.UPDATE_FAILURE);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryLessonDto: ISearchLessonQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [lessons, count] = await this.lessonRepository.getLessonsWithFilters(query.queryLessonDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(lessons, pageMetaDto);

      return ResponseUtil.success(result.data, LessonMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(lessonId: number): Promise<ServiceResponse> {
    try {
      const lesson = await this.validateById(lessonId);

      return ResponseUtil.success(lesson, LessonMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(lessonId: number): Promise<ServiceResponse> {
    try {
      await this.validateById(lessonId);

      const removedLesson = await this.lessonRepository.delete({ id: lessonId });

      if (!removedLesson.affected) ResponseUtil.error(LessonMessages.REMOVE_FAILURE);

      return ResponseUtil.success(removedLesson, LessonMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.REMOVE_FAILURE, error?.status);
    }
  }

  private async validateById(lessonId: number): Promise<LessonEntity> {
    const lesson = await this.lessonRepository.findOneBy({ id: lessonId });
    if (!lesson) throw new NotFoundException(LessonMessages.NOT_FOUND);
    return lesson;
  }
}
