import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { GymEntity } from '../entities/gym.entity';
import { ICreateGym, ISearchGymQuery, IUpdateGym } from '../interfaces/gym.interface';

import { CacheKeys, CacheTTLMilliseconds } from '../../../common/enums/cache';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from 'src/common/enums/gender.enum';

@Injectable()
export class GymRepository extends Repository<GymEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(GymEntity, dataSource.createEntityManager());
  }

  async createAndSave(createGymDto: ICreateGym, adminId: number): Promise<GymEntity> {
    const gym = this.create({ ...createGymDto, admin_id: adminId });
    return await this.save(gym);
  }
  async updateMergeAndSave(gym: GymEntity, updateGymDto: IUpdateGym): Promise<GymEntity> {
    const updatedGym = this.merge(gym, { ...updateGymDto });
    return await this.save(updatedGym);
  }
  async removeGym(gym: GymEntity): Promise<GymEntity> {
    return await this.remove(gym);
  }

  async getGymsWithFilters(adminId: number, filters: ISearchGymQuery, page: number, take: number): Promise<[GymEntity[], number]> {
    const cacheKey = `${CacheKeys.GYMS}-${page}-${take}-${JSON.stringify(filters)}`.replace(':userId', adminId.toString());

    const queryBuilder = this.createQueryBuilder(EntityName.GYMS).where('gyms.admin_id = :admin_id', { admin_id: adminId });

    if (filters?.search) {
      queryBuilder.andWhere('gyms.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.gender) {
      queryBuilder.andWhere(`FIND_IN_SET(:gender, gyms.genders)`, { gender: filters.gender });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('gyms.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_GYMS)
      .getManyAndCount();
  }

  async findByIdAndAdmin(gymId: number, adminId: number, relations?: boolean): Promise<GymEntity | null> {
    if (relations) {
      return this.findOne({ where: { id: gymId, admin_id: adminId }, relations: ['coaches'] });
    }
    return this.findOne({ where: { id: gymId, admin_id: adminId } });
  }
  async findById(gymId: number, relations?: boolean): Promise<GymEntity | null> {
    if (relations) {
      return this.findOne({ where: { id: gymId }, relations: ['coaches'] });
    }
    return this.findOne({ where: { id: gymId } });
  }
  async validateGymAndCoachUserIdGender(gymId: number, coachUserId: number, gender: Gender): Promise<GymEntity | null> {
    return await this.createQueryBuilder(EntityName.GYMS)
      .innerJoin('gyms.coaches', 'coaches')
      .where('gyms.id = :gymId', { gymId })
      .andWhere('coaches.user_id = :coachUserId', { coachUserId })
      .andWhere(`FIND_IN_SET(:gender, gyms.genders)`, { gender: gender })
      .andWhere('coaches.gender = :gender', { gender })
      .getOne();
  }
  async validateGymAndCoachGender(gymId: number, coachId: number, gender: Gender): Promise<GymEntity | null> {
    return await this.createQueryBuilder(EntityName.GYMS)
      .innerJoin('gyms.coaches', 'coaches')
      .where('gyms.id = :gymId', { gymId })
      .andWhere('coaches.id = :coachId', { coachId })
      .andWhere(`FIND_IN_SET(:gender, gyms.genders)`, { gender: gender })
      .andWhere('coaches.gender = :gender', { gender })
      .getOne();
  }
  async findByIdAndOwnerRelationCoaches(gymId: number, adminId: number): Promise<GymEntity | null> {
    return this.findOne({ where: { id: gymId, admin_id: adminId }, relations: ['coaches'] });
  }

  async findOwnedGymsByIds(gymIds: number[], adminId: number): Promise<GymEntity[]> {
    return this.find({
      where: { admin_id: adminId, id: In(gymIds) },
    });
  }

  async findByOwnerId(adminId: number): Promise<GymEntity[]> {
    return this.findBy({ admin_id: adminId });
  }

  async setWalletDepletionByOwnerId(adminId: number, isWalletDepleted: boolean): Promise<void> {
    await this.createQueryBuilder()
      .update(GymEntity)
      .set({ is_wallet_depleted: isWalletDepleted })
      .where('admin_id = :adminId', { adminId })
      .execute();
  }
}
