import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { EntityName } from 'src/common/enums/entity.enum';
import { AgeCategoryEntity } from '../entities/age-category.entity';
import { ICreateAgeCategory, ISearchAgeCategoryQuery, IUpdateAgeCategory } from '../interfaces/age-category.interface';

@Injectable()
export class AgeCategoryRepository extends Repository<AgeCategoryEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(AgeCategoryEntity, dataSource.createEntityManager());
  }

  async createAndSaveAgeCategory(cateAgeCategoryDto: ICreateAgeCategory): Promise<AgeCategoryEntity> {
    const ageCategory = this.create({ ...cateAgeCategoryDto });
    return await this.save(ageCategory);
  }

  async updateAgeCategory(ageCategory: AgeCategoryEntity, updateAgeCategoryDto: IUpdateAgeCategory): Promise<AgeCategoryEntity> {
    const updatedAgeCategory = this.merge(ageCategory, { ...updateAgeCategoryDto });
    return await this.save(updatedAgeCategory);
  }

  async getAgeCategoriesWithFilters(filters: ISearchAgeCategoryQuery, page: number, take: number): Promise<[AgeCategoryEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.AgeCategories);

    // if (filters?.search) {
    //   queryBuilder.andWhere('age-categories.name LIKE :search', { search: `%${filters.search}%` });
    // }

    // if (filters?.gender) {
    //   queryBuilder.andWhere(`FIND_IN_SET(:gender, age-categories.genders)`, { gender: filters.gender });
    // }

    // if (filters?.sort_order) {
    //   queryBuilder.orderBy('age-categories.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    // }

    return (
      queryBuilder
        // .leftJoinAndSelect('age-categories.nextAgeCategories', 'nextAgeCategories')
        .skip((page - 1) * take)
        .take(take)
        .getManyAndCount()
    );
  }

  async findByIds(clubIds: number[]): Promise<AgeCategoryEntity[]> {
    return this.find({ where: { id: In(clubIds) } });
  }
}
