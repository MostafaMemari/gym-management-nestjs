import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CoachEntity } from '../entities/coach.entity';
import { ICoachFilter } from '../interfaces/coach.interface';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';

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

  async getCoachesWithFilters(userId: number, filters: ICoachFilter, page: number, take: number): Promise<[CoachEntity[], number]> {
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

  async findCoachByNationalCode(nationalCode: string, ownerId: number): Promise<CoachEntity | null> {
    return this.findOne({ where: { national_code: nationalCode, ownerId }, relations: ['clubs'] });
  }

  async findByIdAndOwner(coachId: number, ownerId: number): Promise<CoachEntity | null> {
    return this.findOne({ where: { id: coachId, ownerId }, relations: ['clubs'] });
  }

  async existsCoachByGenderInClub(clubId: number, gender: Gender): Promise<boolean> {
    const count = await this.createQueryBuilder(EntityName.Coaches)
      .innerJoin('coaches.clubs', 'club')
      .where('club.id = :clubId', { clubId })
      .andWhere('coaches.gender = :gender', { gender })
      .getCount();

    return count > 0;
  }
  async existsCoachByClubId(clubId: number): Promise<boolean> {
    const count = await this.count({ where: { clubs: { id: clubId } } });
    return count > 0;
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
