import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { ChapterRepository } from './repositories/chapter.repository';
import { ICreateChapter, ISearchChapterQuery, IUpdateChapter } from './interfaces/chapter.interface';
import { ChapterEntity } from './entities/chapter.entity';
import { ChapterMessages } from './enums/chapter.message';
import { CourseService } from '../course/course.service';

@Injectable()
export class ChapterService {
  constructor(private readonly chapterRepository: ChapterRepository, private readonly courseService: CourseService) {}

  async create(createChapterDto: ICreateChapter): Promise<ServiceResponse> {
    try {
      await this.courseService.validateById(createChapterDto?.courseId);
      const chapter = await this.chapterRepository.createAndSaveChapter({ ...createChapterDto });

      return ResponseUtil.success(chapter, ChapterMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ChapterMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(chapterId: number, updateChapterDto: IUpdateChapter): Promise<ServiceResponse> {
    try {
      const chapter = await this.validateById(chapterId);

      return ResponseUtil.success({}, ChapterMessages.UPDATE_FAILURE);
    } catch (error) {
      ResponseUtil.error(error?.message || ChapterMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryChapterDto: ISearchChapterQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [chapters, count] = await this.chapterRepository.getChaptersWithFilters(query.queryChapterDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(chapters, pageMetaDto);

      return ResponseUtil.success(result.data, ChapterMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ChapterMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(chapterId: number): Promise<ServiceResponse> {
    try {
      const chapter = await this.validateById(chapterId);

      return ResponseUtil.success(chapter, ChapterMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ChapterMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(chapterId: number): Promise<ServiceResponse> {
    try {
      await this.validateById(chapterId);

      const removedChapter = await this.chapterRepository.delete({ id: chapterId });

      if (!removedChapter.affected) ResponseUtil.error(ChapterMessages.REMOVE_FAILURE);

      return ResponseUtil.success(removedChapter, ChapterMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ChapterMessages.REMOVE_FAILURE, error?.status);
    }
  }

  private async validateById(chapterId: number): Promise<ChapterEntity> {
    const chapter = await this.chapterRepository.findOneBy({ id: chapterId });
    if (!chapter) throw new NotFoundException(ChapterMessages.NOT_FOUND);
    return chapter;
  }
}
