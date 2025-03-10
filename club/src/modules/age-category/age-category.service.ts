import { Injectable, NotFoundException } from '@nestjs/common';

import { AgeCategoryEntity } from './entities/age-category.entity';
import { AgeCategoryMessages } from './enums/age-category.message';
import { CacheKeys } from './enums/cache.enum';
import { IAgeCategoryCreateDto, IAgeCategoryFilter, IAgeCategoryUpdateDto } from './interfaces/age-category.interface';
import { AgeCategoryRepository } from './repositories/age-category.repository';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheService } from '../cache/cache.service';

@Injectable()
export class AgeCategoryService {
  constructor(private readonly cacheService: CacheService, private readonly ageCategoryRepository: AgeCategoryRepository) {}

  async create(createAgeCategoryDto: IAgeCategoryCreateDto): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.ageCategoryRepository.createAndSaveAgeCategory(createAgeCategoryDto);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.CREATE_FAILURE, error?.status);
    }
  }

  async update(ageCategoryId: number, updateAgeCategoryDto: IAgeCategoryUpdateDto) {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);

      const updatedAgeCategory = await this.ageCategoryRepository.updateAgeCategory(ageCategory, updateAgeCategoryDto);

      return ResponseUtil.success({ ...updatedAgeCategory }, AgeCategoryMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.UPDATE_FAILURE, error?.status);
    }
  }

  async getAll(query: { queryAgeCategoryDto: IAgeCategoryFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const cacheKey = `${CacheKeys.AGE_CATEGORIES}-${page}-${take}-${JSON.stringify(query.queryAgeCategoryDto)}`;

      const cachedData = await this.cacheService.get<Promise<ServiceResponse>>(cacheKey);
      if (cachedData) return cachedData;

      const [ageCategories, count] = await this.ageCategoryRepository.getAgeCategoriesWithFilters(query.queryAgeCategoryDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(ageCategories, pageMetaDto);

      await this.cacheService.set(cacheKey, result, 600);

      return ResponseUtil.success({ ...result }, AgeCategoryMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);
      const removedAgeCategory = await this.ageCategoryRepository.delete(ageCategoryId);

      if (removedAgeCategory.affected) return ResponseUtil.success(ageCategory, AgeCategoryMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async validateAgeCategoryId(ageCategoryId: number): Promise<AgeCategoryEntity> {
    const ageCategory = await this.ageCategoryRepository.findOneBy({ id: ageCategoryId });
    if (!ageCategory) throw new NotFoundException(AgeCategoryMessages.NOT_FOUND);
    return ageCategory;
  }
}
