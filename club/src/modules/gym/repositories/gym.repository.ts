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

  async createAndSaveGym(createGymDto: ICreateGym, ownerId: number): Promise<GymEntity> {
    const gym = this.create({ ...createGymDto, owner_id: ownerId });
    return await this.save(gym);
  }
  async updateMergeAndSave(gym: GymEntity, updateGymDto: IUpdateGym): Promise<GymEntity> {
    const updatedGym = this.merge(gym, { ...updateGymDto });
    return await this.save(updatedGym);
  }
  async removeGym(gym: GymEntity): Promise<GymEntity> {
    return await this.remove(gym);
  }

  async getGymsWithFilters(userId: number, filters: ISearchGymQuery, page: number, take: number): Promise<[GymEntity[], number]> {
    const cacheKey = `${CacheKeys.CLUBS}-userId:${userId}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.GYMS).where('gyms.owner_id = :owner_id', { owner_id: userId });

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
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_CLUBS)
      .getManyAndCount();
  }

  async findByIdAndOwner(gymId: number, ownerId: number): Promise<GymEntity | null> {
    return this.findOne({ where: { id: gymId, owner_id: ownerId } });
  }
  async validateGymOwnershipAndCoachGender(gymId: number, coachId: number, gender: Gender, userId: number): Promise<GymEntity | null> {
    return await this.createQueryBuilder(EntityName.GYMS)
      .where('gyms.id = :gymId', { gymId })
      .andWhere('gyms.owner_id = :ownerId', { ownerId: userId })
      .leftJoin('gyms.coaches', 'coaches')
      .andWhere('coaches.id = :coachId', { coachId })
      .andWhere(`FIND_IN_SET(:gender, gyms.genders)`, { gender: gender })
      .andWhere('coaches.gender = :gender', { gender })
      .getOne();
  }
  async findByIdAndOwnerRelationCoaches(gymId: number, ownerId: number): Promise<GymEntity | null> {
    return this.findOne({ where: { id: gymId, owner_id: ownerId }, relations: ['coaches'] });
  }

  async findOwnedGymsByIds(gymIds: number[], ownerId: number): Promise<GymEntity[]> {
    return this.find({
      where: { owner_id: ownerId, id: In(gymIds) },
    });
  }

  async findByOwnerId(ownerId: number): Promise<GymEntity[]> {
    return this.findBy({ owner_id: ownerId });
  }

  async setWalletDepletionByOwnerId(ownerId: number, isWalletDepleted: boolean): Promise<void> {
    await this.createQueryBuilder()
      .update(GymEntity)
      .set({ is_wallet_depleted: isWalletDepleted })
      .where('owner_id = :ownerId', { ownerId })
      .execute();
  }
}
