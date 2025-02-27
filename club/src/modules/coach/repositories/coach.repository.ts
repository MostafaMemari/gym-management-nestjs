import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CoachEntity } from '../entities/coach.entity';
import { CoachMessages } from '../enums/coach.message';
import { ISeachCoachQuery } from '../interfaces/coach.interface';
import { EntityName } from 'src/common/enums/entity.enum';

@Injectable()
export class CoachRepository extends Repository<CoachEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(CoachEntity, dataSource.createEntityManager());
  }

  async createCoachWithTransaction(coachData: Partial<CoachEntity>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const coach = this.create(coachData);
      await queryRunner.manager.save(coach);
      await queryRunner.commitTransaction();
      return coach;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateCoach(coach: CoachEntity, updateData: Partial<CoachEntity>) {
    const hasRelations = ['clubs'].some((rel) => updateData.hasOwnProperty(rel));

    if (hasRelations) {
      if (updateData.clubs) {
        coach.clubs = updateData.clubs;
      }

      const updatedCoach = this.merge(coach, updateData);
      return await this.save(updatedCoach);
    } else {
      return await this.update(coach.id, updateData);
    }
  }

  async getCoachesWithFilters(userId: number, filters: ISeachCoachQuery, page: number, take: number): Promise<[CoachEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Coaches)
      .leftJoinAndSelect('coaches.clubs', 'club')
      .where('club.ownerId = :userId', { userId });

    if (filters?.search) {
      queryBuilder.andWhere('(coaches.full_name LIKE :search OR coaches.national_code LIKE :search)', { search: `%${filters.search}%` });
    }
    if (filters?.gender) {
      queryBuilder.andWhere('coaches.gender = :gender', { gender: filters?.gender });
    }
    if (filters?.is_active !== undefined) {
      queryBuilder.andWhere('coaches.is_active = :isActive', { isActive: filters?.is_active });
    }

    if (filters?.phone_number) {
      queryBuilder.andWhere('coaches.phone_number LIKE :phoneNumber', { phoneNumber: `%${filters?.phone_number}%` });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`coaches.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('coaches.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`coaches.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('coaches.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async removeCoachById(coachId: number): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const removedCoach = await queryRunner.manager.delete(CoachEntity, coachId);
      await queryRunner.commitTransaction();

      return removedCoach.affected > 0;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findCoachWithRelations(coachId: number): Promise<CoachEntity | null> {
    return await this.createQueryBuilder(EntityName.Coaches)
      .leftJoin('coach.coaches', 'student')
      .leftJoin('coach.clubs', 'club')
      .where('coach.id = :coachId', { coachId })
      .andWhere('(student.id IS NOT NULL OR club.id IS NOT NULL)')
      .getOne();
  }

  async findCoachByNationalCode(nationalCode: string, userId: number): Promise<CoachEntity | null> {
    return await this.createQueryBuilder(EntityName.Coaches)
      .where('coaches.national_code = :nationalCode', { nationalCode })
      .leftJoinAndSelect('coaches.clubs', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();
  }

  async findCoachByIdAndOwner(coachId: number, userId: number): Promise<CoachEntity | null> {
    return await this.createQueryBuilder(EntityName.Coaches)
      .where('coaches.id = :coachId', { coachId })
      .leftJoinAndSelect('coaches.clubs', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
