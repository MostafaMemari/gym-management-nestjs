import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { BeltEntity } from '../entities/belt.entity';
import { IBeltCreateDto, IBeltFilter, IBeltUpdateDto } from '../interfaces/belt.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheKeys } from '../../../common/enums/cache';
import { CacheTTLMilliseconds } from 'src/common/enums/cache';

@Injectable()
export class BeltRepository extends Repository<BeltEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(BeltEntity, dataSource.createEntityManager());
  }

  async createAndSave(createBeltDto: IBeltCreateDto): Promise<BeltEntity> {
    const belt = this.create({ ...createBeltDto });
    return await this.save(belt);
  }
  async updateMergeAndSave(belt: BeltEntity, updateBeltDto: IBeltUpdateDto): Promise<BeltEntity> {
    const updatedBelt = this.merge(belt, { ...updateBeltDto });
    return await this.save(updatedBelt);
  }

  async getBeltsWithFilters(filters: IBeltFilter, page: number, take: number): Promise<[BeltEntity[], number]> {
    const cacheKey = `${CacheKeys.BELTS}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.BELTS);

    if (filters?.search) {
      queryBuilder.andWhere('belts.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`belts.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('belts.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`belts.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('belts.updated_at', 'DESC');
    }
    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_BELTS)
      .getManyAndCount();
  }
  async findByIds(ids: number[]): Promise<BeltEntity[]> {
    return this.find({ where: { id: In(ids) } });
  }
  async getBeltNamesAndIds() {
    return await this.find({ select: ['id', 'name'] });
  }
}

const validSortFields = ['level', 'updated_at', 'created_at'];
