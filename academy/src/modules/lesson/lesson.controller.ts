import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { LessonPatterns } from './patterns/lesson.pattern';
import { LessonService } from './lesson.service';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ICreateLesson, ISearchLessonQuery, IUpdateLesson } from './interfaces/lesson.interface';

@Controller()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @MessagePattern(LessonPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(LessonPatterns.CREATE)
  create(@Payload() data: { chapterId: number; createLessonDto: ICreateLesson }): Promise<ServiceResponse> {
    const { chapterId, createLessonDto } = data;

    return this.lessonService.create(chapterId, createLessonDto);
  }
  @MessagePattern(LessonPatterns.UPDATE)
  update(@Payload() data: { lessonId: number; updateLessonDto: IUpdateLesson }): Promise<ServiceResponse> {
    const { lessonId, updateLessonDto } = data;

    return this.lessonService.update(lessonId, updateLessonDto);
  }
  @MessagePattern(LessonPatterns.GET_ALL)
  findAll(@Payload() data: { queryLessonDto: ISearchLessonQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { queryLessonDto, paginationDto } = data;

    return this.lessonService.getAll({ queryLessonDto, paginationDto });
  }
  @MessagePattern(LessonPatterns.GET_ONE)
  findOne(@Payload() data: { lessonId: number }): Promise<ServiceResponse> {
    const { lessonId } = data;

    return this.lessonService.findOneById(lessonId);
  }
  @MessagePattern(LessonPatterns.REMOVE)
  remove(@Payload() data: { lessonId: number }): Promise<ServiceResponse> {
    const { lessonId } = data;

    return this.lessonService.findOneById(lessonId);
  }
}
