import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ICreateChapter, ISearchChapterQuery, IUpdateChapter } from './interfaces/chapter.interface';
import { ChapterPatterns } from './patterns/chapter.pattern';
import { ChapterService } from './chapter.service';

@Controller()
export class ChapterController {
  constructor(private readonly chapterService: ChapterService) {}

  @MessagePattern(ChapterPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(ChapterPatterns.CREATE)
  create(@Payload() data: { courseId: number; createChapterDto: ICreateChapter }): Promise<ServiceResponse> {
    const { courseId, createChapterDto } = data;

    return this.chapterService.create(courseId, createChapterDto);
  }
  @MessagePattern(ChapterPatterns.UPDATE)
  update(@Payload() data: { chapterId: number; updateChapterDto: IUpdateChapter }): Promise<ServiceResponse> {
    const { chapterId, updateChapterDto } = data;

    return this.chapterService.update(chapterId, updateChapterDto);
  }
  @MessagePattern(ChapterPatterns.GET_ALL)
  findAll(@Payload() data: { queryChapterDto: ISearchChapterQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { queryChapterDto, paginationDto } = data;

    return this.chapterService.getAll({ queryChapterDto, paginationDto });
  }
  @MessagePattern(ChapterPatterns.GET_ONE)
  findOne(@Payload() data: { chapterId: number }): Promise<ServiceResponse> {
    const { chapterId } = data;

    return this.chapterService.findOneById(chapterId);
  }
  @MessagePattern(ChapterPatterns.REMOVE)
  remove(@Payload() data: { chapterId: number }): Promise<ServiceResponse> {
    const { chapterId } = data;

    return this.chapterService.removeById(chapterId);
  }
}
