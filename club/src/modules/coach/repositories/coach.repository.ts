import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CoachEntity } from '../entities/coach.entity';
import { ICoachFilter } from '../interfaces/coach.interface';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { CacheKeys } from '../../../common/enums/cache';
import { CacheTTLMilliseconds } from '../../../common/enums/cache';

@Injectable()
export class CoachRepository extends Repository<CoachEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(CoachEntity, dataSource.createEntityManager());
  }

  async createAndSave(createCoachDto: Partial<CoachEntity>) {
    const coach = this.create({ ...createCoachDto });
    return await this.save(coach);
  }

  async updateMergeAndSave(coach: CoachEntity, updateData: Partial<CoachEntity>) {
    if (updateData.gyms) coach.gyms = updateData.gyms;
    const updatedCoach = this.merge(coach, updateData);
    return await this.save(updatedCoach);
  }

  async getCoachesWithFilters(adminId: number, filters: ICoachFilter, page: number, take: number): Promise<[CoachEntity[], number]> {
    const cacheKey = `${CacheKeys.COACHES}-${page}-${take}-${JSON.stringify(filters)}`.replace(':userId', adminId.toString());

    const queryBuilder = this.createQueryBuilder(EntityName.COACHES).where('coaches.admin_id = :admin_id', { admin_id: adminId });

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
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_COACHES)
      .getManyAndCount();
  }

  async removeCoach(coach: CoachEntity): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.remove(coach);

      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findCoachByNationalCode(nationalCode: string): Promise<CoachEntity | null> {
    return this.findOne({ where: { national_code: nationalCode }, relations: ['gyms'] });
  }

  async findByIdAndAdmin(coachId: number, adminId: number): Promise<CoachEntity | null> {
    return this.findOne({ where: { id: coachId, admin_id: adminId }, relations: ['gyms'] });
  }

  async existsCoachByGenderInGym(gym_id: number, gender: Gender): Promise<boolean> {
    const count = await this.createQueryBuilder(EntityName.COACHES)
      .innerJoin('coaches.gyms', 'gym')
      .where('gym.id = :gym_id', { gym_id })
      .andWhere('coaches.gender = :gender', { gender })
      .getCount();

    return count > 0;
  }
  async existsCoachByGymId(gym_id: number): Promise<boolean> {
    const count = await this.count({ where: { gyms: { id: gym_id } } });
    return count > 0;
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
