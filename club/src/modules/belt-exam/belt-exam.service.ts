import { Injectable, NotFoundException } from '@nestjs/common';

import { BeltExamEntity } from './entities/belt-exam.entity';
import { BeltExamMessages } from './enums/belt-exam.message';
import { IBeltExamCreateDto, IBeltExamUpdateDto, IBeltExamFilter } from './interfaces/belt-exam.interface';
import { BeltExamRepository } from './repositories/belt-exam.repository';

import { BeltService } from '../belt/belt.service';
import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheKeys, CacheTTLMilliseconds } from '../../common/enums/cache';

@Injectable()
export class BeltExamService {
  constructor(
    private readonly beltExamRepository: BeltExamRepository,
    private readonly cacheService: CacheService,
    private readonly beltService: BeltService,
  ) {}

  async create(createBeltExamDto: IBeltExamCreateDto): Promise<ServiceResponse> {
    try {
      const { beltIds } = createBeltExamDto;
      if (beltIds) {
        const belts = await this.beltService.validateByIds(beltIds);
        createBeltExamDto.belts = belts;
      }

      const beltExam = await this.beltExamRepository.createAndSaveBeltExam(createBeltExamDto);

      return ResponseUtil.success(beltExam, BeltExamMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(beltExamId: number, updateBeltExamDto: IBeltExamUpdateDto): Promise<ServiceResponse> {
    try {
      const { beltIds } = updateBeltExamDto;

      const beltExam = await this.validateById(beltExamId);

      if (beltIds) {
        const belts = await this.beltService.validateByIds(beltIds);
        updateBeltExamDto.belts = belts;
      }

      const updatedBeltExam = await this.beltExamRepository.updateBeltExam(beltExam, updateBeltExamDto);

      return ResponseUtil.success({ ...updatedBeltExam }, BeltExamMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryBeltExamDto: IBeltExamFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;
    try {
      const cacheKey = `${CacheKeys.BELT_EXAMS}-${page}-${take}-${JSON.stringify(query.queryBeltExamDto)}`;
      const cachedData = await this.cacheService.get<Promise<ServiceResponse>>(cacheKey);
      if (cachedData) return ResponseUtil.success(cachedData.data, BeltExamMessages.GET_ALL_SUCCESS);

      const [beltExams, count] = await this.beltExamRepository.getBeltExamsWithFilters(query.queryBeltExamDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(beltExams, pageMetaDto);

      await this.cacheService.set(cacheKey, result, CacheTTLMilliseconds.GET_ALL_BELT_EXAMS);

      return ResponseUtil.success(result.data, BeltExamMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async findOneById(beltExamId: number): Promise<ServiceResponse> {
    try {
      const beltExam = await this.validateById(beltExamId);

      return ResponseUtil.success(beltExam, BeltExamMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }
  async removeById(beltExamId: number): Promise<ServiceResponse> {
    try {
      const beltExam = await this.validateById(beltExamId);

      const removedBeltExam = await this.beltExamRepository.delete({ id: beltExamId });

      if (!removedBeltExam.affected) ResponseUtil.error(BeltExamMessages.REMOVE_FAILURE);
      return ResponseUtil.success(beltExam, BeltExamMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }

  async validateById(beltExamId: number): Promise<BeltExamEntity> {
    const beltExam = await this.beltExamRepository.findOneBy({ id: beltExamId });
    if (!beltExam) throw new NotFoundException(BeltExamMessages.NOT_FOUND);
    return beltExam;
  }
}
