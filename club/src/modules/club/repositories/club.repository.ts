import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { ClubEntity } from '../entities/club.entity';
import { CacheKeys } from '../../../common/enums/cache';
import { ICreateClub, ISearchClubQuery, IUpdateClub } from '../interfaces/club.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { CacheTTLMilliseconds } from 'src/common/enums/cache';

@Injectable()
export class ClubRepository extends Repository<ClubEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ClubEntity, dataSource.createEntityManager());
  }

  async createAndSaveClub(createClubDto: ICreateClub, ownerId: number): Promise<ClubEntity> {
    const club = this.create({ ...createClubDto, owner_id: ownerId });
    return await this.save(club);
  }
  async updateClub(club: ClubEntity, updateClubDto: IUpdateClub): Promise<ClubEntity> {
    const updatedClub = this.merge(club, { ...updateClubDto });
    return await this.save(updatedClub);
  }

  async removeClub(club: ClubEntity): Promise<ClubEntity> {
    return await this.remove(club);
  }

  async getClubsWithFilters(userId: number, filters: ISearchClubQuery, page: number, take: number): Promise<[ClubEntity[], number]> {
    const cacheKey = `${CacheKeys.CLUBS}-userId:${userId}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.CLUBS).where('clubs.owner_id = :owner_id', { owner_id: userId });

    if (filters?.search) {
      queryBuilder.andWhere('clubs.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.gender) {
      queryBuilder.andWhere(`FIND_IN_SET(:gender, clubs.genders)`, { gender: filters.gender });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('clubs.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_CLUBS)
      .getManyAndCount();
  }

  async findByIdAndOwner(clubId: number, ownerId: number): Promise<ClubEntity | null> {
    return this.findOne({ where: { id: clubId, owner_id: ownerId } });
  }
  async findByIdAndOwnerRelationCoaches(clubId: number, ownerId: number): Promise<ClubEntity | null> {
    return this.findOne({ where: { id: clubId, owner_id: ownerId }, relations: ['coaches'] });
  }

  async findOwnedClubsByIds(clubIds: number[], ownerId: number): Promise<ClubEntity[]> {
    return this.find({
      where: { owner_id: ownerId, id: In(clubIds) },
    });
  }

  async findByOwnerId(ownerId: number): Promise<ClubEntity[]> {
    return this.findBy({ owner_id: ownerId });
  }

  async setWalletDepletionByOwnerId(ownerId: number, isWalletDepleted: boolean): Promise<void> {
    await this.createQueryBuilder()
      .update(ClubEntity)
      .set({ is_wallet_depleted: isWalletDepleted })
      .where('owner_id = :ownerId', { ownerId })
      .execute();
  }
}
