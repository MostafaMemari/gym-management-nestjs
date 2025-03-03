import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { BeltEntity } from '../entities/belt.entity';
import { EntityName } from 'src/common/enums/entity.enum';
import { ICreateBelt, ISearchBeltQuery, IUpdateBelt } from '../interfaces/belt.interface';

@Injectable()
export class BeltRepository extends Repository<BeltEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(BeltEntity, dataSource.createEntityManager());
  }

  async createAndSaveBelt(createBeltDto: ICreateBelt): Promise<BeltEntity> {
    const belt = this.create({ ...createBeltDto });
    return await this.save(belt);
  }

  async updateBelt(belt: BeltEntity, updateBeltDto: IUpdateBelt): Promise<BeltEntity> {
    const updatedBelt = this.merge(belt, { ...updateBeltDto });
    return await this.save(updatedBelt);
  }

  async getBeltsWithFilters(filters: ISearchBeltQuery, page: number, take: number): Promise<[BeltEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Belts);

    // if (filters?.search) {
    //   queryBuilder.andWhere('belts.name LIKE :search', { search: `%${filters.search}%` });
    // }

    // if (filters?.gender) {
    //   queryBuilder.andWhere(`FIND_IN_SET(:gender, belts.genders)`, { gender: filters.gender });
    // }

    // if (filters?.sort_order) {
    //   queryBuilder.orderBy('belts.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    // }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }
}
