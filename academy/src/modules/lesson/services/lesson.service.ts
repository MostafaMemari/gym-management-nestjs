import { Injectable, NotFoundException } from '@nestjs/common';

import { PageDto, PageMetaDto } from '../../../common/dtos/pagination.dto';
import { IPagination } from '../../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../../common/utils/response';
import { LessonMessages } from '../enums/lesson.message';
import { LessonRepository } from '../repositories/lesson.repository';
import { ICreateLesson, ISearchLessonQuery, IUpdateLesson } from '../interfaces/lesson.interface';
import { LessonEntity } from '../entities/lesson.entity';
import { UserLessonProgressRepository } from '../repositories/user-lesson-progress.repository';

@Injectable()
export class LessonService {
  constructor(private readonly lessonRepository: LessonRepository, private readonly progressRepository: UserLessonProgressRepository) {}

  async create(chapterId: number, createLessonDto: ICreateLesson): Promise<ServiceResponse> {
    try {
      const lesson = await this.lessonRepository.createAndSaveLesson({ ...createLessonDto, chapterId });

      return ResponseUtil.success(lesson, LessonMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(lessonId: number, updateLessonDto: IUpdateLesson): Promise<ServiceResponse> {
    try {
      const lesson = await this.validateById(lessonId);

      const updatedLesson = await this.lessonRepository.updateLesson(lesson, updateLessonDto);

      return ResponseUtil.success(updatedLesson, LessonMessages.UPDATE_SUCCESS);
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
      const lesson = await this.validateById(lessonId);

      await this.lessonRepository.remove(lesson);

      return ResponseUtil.success(lesson, LessonMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async getLessonsWithProgress(userId: number, chapterId: number) {
    try {
      const lessons = await this.lessonRepository.getLessonsByChapter(chapterId);
      const progress = await this.progressRepository.getUserProgress(
        userId,
        lessons.map((l) => l.id),
      );

      const lesson = lessons.map((lesson) => ({
        ...lesson,
        is_completed: progress.some((p) => p.lesson.id === lesson.id && p.is_completed),
      }));

      return ResponseUtil.success(lesson, LessonMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || LessonMessages.GET_ALL_FAILURE, error?.status);
    }
  }

  private async validateById(lessonId: number): Promise<LessonEntity> {
    const lesson = await this.lessonRepository.findOneBy({ id: lessonId });
    if (!lesson) throw new NotFoundException(LessonMessages.NOT_FOUND);
    return lesson;
  }
}
