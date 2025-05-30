import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { AgeCategoryEntity } from '../entities/age-category.entity';
import { IAgeCategoryCreateDto, IAgeCategoryFilter, IAgeCategoryUpdateDto } from '../interfaces/age-category.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheKeys, CacheTTLMilliseconds } from '../../../common/enums/cache';

@Injectable()
export class AgeCategoryRepository extends Repository<AgeCategoryEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(AgeCategoryEntity, dataSource.createEntityManager());
  }

  async createAndSave(cateAgeCategoryDto: IAgeCategoryCreateDto): Promise<AgeCategoryEntity> {
    const ageCategory = this.create({ ...cateAgeCategoryDto });
    return await this.save(ageCategory);
  }
  async updateMergeAndSave(ageCategory: AgeCategoryEntity, updateAgeCategoryDto: IAgeCategoryUpdateDto): Promise<AgeCategoryEntity> {
    const updatedAgeCategory = this.merge(ageCategory, { ...updateAgeCategoryDto });
    return await this.save(updatedAgeCategory);
  }

  async getAgeCategoriesWithFilters(filters: IAgeCategoryFilter, page: number, take: number): Promise<[AgeCategoryEntity[], number]> {
    const cacheKey = `${CacheKeys.AGE_CATEGORIES}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.AGE_CATEGORIES);

    if (filters?.search) {
      queryBuilder.andWhere('age_categories.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`age_categories.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('age_categories.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`age_categories.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('age_categories.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_AGE_CATEGORIES)
      .getManyAndCount();
  }
}

const validSortFields = ['start_date', 'end_date', 'updated_at', 'created_at'];
