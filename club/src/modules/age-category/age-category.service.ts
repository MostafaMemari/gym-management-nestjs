import { Injectable, NotFoundException } from '@nestjs/common';

import { AgeCategoryEntity } from './entities/age-category.entity';
import { AgeCategoryMessages } from './enums/age-category.message';
import { CacheKeys } from './enums/cache.enum';
import { IAgeCategoryCreateDto, IAgeCategoryFilter, IAgeCategoryUpdateDto } from './interfaces/age-category.interface';
import { AgeCategoryRepository } from './repositories/age-category.repository';

import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';

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
  async update(ageCategoryId: number, updateAgeCategoryDto: IAgeCategoryUpdateDto): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateById(ageCategoryId);

      const updatedAgeCategory = await this.ageCategoryRepository.updateAgeCategory(ageCategory, updateAgeCategoryDto);

      return ResponseUtil.success({ ...updatedAgeCategory }, AgeCategoryMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryAgeCategoryDto: IAgeCategoryFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [ageCategories, count] = await this.ageCategoryRepository.getAgeCategoriesWithFilters(query.queryAgeCategoryDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(ageCategories, pageMetaDto);

      return ResponseUtil.success(result.data, AgeCategoryMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateById(ageCategoryId);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateById(ageCategoryId);
      const removedAgeCategory = await this.ageCategoryRepository.delete({ id: ageCategoryId });

      if (!removedAgeCategory.affected) ResponseUtil.error(AgeCategoryMessages.REMOVE_FAILURE);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || AgeCategoryMessages.REMOVE_FAILURE, error?.status);
    }
  }

  private async validateById(ageCategoryId: number): Promise<AgeCategoryEntity> {
    const ageCategory = await this.ageCategoryRepository.findOneBy({ id: ageCategoryId });
    if (!ageCategory) throw new NotFoundException(AgeCategoryMessages.NOT_FOUND);
    return ageCategory;
  }
}
