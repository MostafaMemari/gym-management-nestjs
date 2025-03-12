import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { EntityName } from 'src/common/enums/entity.enum';
import { BeltExamEntity } from '../entities/belt-exam.entity';
import { IBeltExamCreateDto, IBeltExamFilter, IBeltExamUpdateDto } from '../interfaces/belt-exam.interface';

@Injectable()
export class BeltExamRepository extends Repository<BeltExamEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(BeltExamEntity, dataSource.createEntityManager());
  }

  async createAndSaveBeltExam(createBeltExamDto: IBeltExamCreateDto): Promise<BeltExamEntity> {
    const beltExam = this.create({ ...createBeltExamDto });
    return await this.save(beltExam);
  }

  async updateBeltExam(beltExam: BeltExamEntity, updateBeltExamDto: IBeltExamUpdateDto): Promise<BeltExamEntity> {
    const updatedBeltExam = this.merge(beltExam, { ...updateBeltExamDto });
    return await this.save(updatedBeltExam);
  }

  async getBeltExamsWithFilters(filters: IBeltExamFilter, page: number, take: number): Promise<[BeltExamEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.BELT_EXAMS).innerJoin('belt_exams.belts', 'belts');

    if (filters?.search) {
      queryBuilder.andWhere('belt_exams.name LIKE :search OR belt_exams.description LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.gender) {
      queryBuilder.andWhere(`FIND_IN_SET(:gender, belt_exams.genders)`, { gender: filters.gender });
    }

    if (filters?.event_places?.length) {
      queryBuilder.andWhere(`belt_exams.event_places REGEXP :eventPlaces`, { eventPlaces: filters.event_places.join('|') });
    }

    if (filters?.belt_ids?.length) {
      queryBuilder.andWhere('belts.id IN (:...beltIds)', { beltIds: filters.belt_ids });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`belt_exams.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('belt_exams.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`belt_exams.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('belt_exams.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findByIds(clubIds: number[]): Promise<BeltExamEntity[]> {
    return this.find({ where: { id: In(clubIds) } });
  }
}

const validSortFields = ['register_date', 'event_date', 'updated_at', 'created_at'];
