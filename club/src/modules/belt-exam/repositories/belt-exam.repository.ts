import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { EntityName } from 'src/common/enums/entity.enum';
import { BeltExamEntity } from '../entities/belt-exam.entity';
import { IBeltCreateDtoExam, ISearchBeltExamQuery, IBeltUpdateDtoExam } from '../interfaces/belt-exam.interface';

@Injectable()
export class BeltExamRepository extends Repository<BeltExamEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(BeltExamEntity, dataSource.createEntityManager());
  }

  async createAndSaveBeltExam(createBeltExamDto: IBeltCreateDtoExam): Promise<BeltExamEntity> {
    const beltExam = this.create({ ...createBeltExamDto });
    return await this.save(beltExam);
  }

  async updateBeltExam(beltExam: BeltExamEntity, updateBeltExamDto: IBeltUpdateDtoExam): Promise<BeltExamEntity> {
    const updatedBeltExam = this.merge(beltExam, { ...updateBeltExamDto });
    return await this.save(updatedBeltExam);
  }

  async getBeltExamsWithFilters(filters: ISearchBeltExamQuery, page: number, take: number): Promise<[BeltExamEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.BELT_EXAMS);

    // if (filters?.search) {
    //   queryBuilder.andWhere('beltExams.name LIKE :search', { search: `%${filters.search}%` });
    // }

    // if (filters?.gender) {
    //   queryBuilder.andWhere(`FIND_IN_SET(:gender, beltExams.genders)`, { gender: filters.gender });
    // }

    // if (filters?.sort_order) {
    //   queryBuilder.orderBy('beltExams.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    // }

    return (
      queryBuilder
        // .leftJoinAndSelect('beltExams.nextBeltExam', 'nextBeltExam')
        .skip((page - 1) * take)
        .take(take)
        .getManyAndCount()
    );
  }

  async findByIds(clubIds: number[]): Promise<BeltExamEntity[]> {
    return this.find({ where: { id: In(clubIds) } });
  }
}
