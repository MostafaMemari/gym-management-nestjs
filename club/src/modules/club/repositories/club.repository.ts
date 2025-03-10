import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { ClubEntity } from '../entities/club.entity';
import { EntityName } from 'src/common/enums/entity.enum';
import { ICreateClub, ISearchClubQuery, IUpdateClub } from '../interfaces/club.interface';

@Injectable()
export class ClubRepository extends Repository<ClubEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(ClubEntity, dataSource.createEntityManager());
  }

  async createAndSaveClub(createClubDto: ICreateClub, ownerId: number): Promise<ClubEntity> {
    const club = this.create({ ...createClubDto, ownerId });
    return await this.save(club);
  }

  async updateClub(club: ClubEntity, updateClubDto: IUpdateClub): Promise<ClubEntity> {
    const updatedClub = this.merge(club, { ...updateClubDto });
    return await this.save(updatedClub);
  }

  async getClubsWithFilters(userId: number, filters: ISearchClubQuery, page: number, take: number): Promise<[ClubEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.CLUBS).where('clubs.ownerId = :ownerId', { ownerId: userId });

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
      .getManyAndCount();
  }

  async findByIdAndOwner(clubId: number, ownerId: number): Promise<ClubEntity | null> {
    return this.findOne({ where: { id: clubId, ownerId } });
  }
  async findByIdAndOwnerRelationCoaches(clubId: number, ownerId: number): Promise<ClubEntity | null> {
    return this.findOne({ where: { id: clubId, ownerId }, relations: ['coaches'] });
  }

  async findOwnedClubsByIds(clubIds: number[], ownerId: number): Promise<ClubEntity[]> {
    return this.find({
      where: { ownerId, id: In(clubIds) },
    });
  }

  async findByOwnerId(ownerId: number): Promise<ClubEntity[]> {
    return this.findBy({ ownerId });
  }

  async setWalletDepletionByOwnerId(ownerId: number, isWalletDepleted: boolean): Promise<void> {
    await this.createQueryBuilder()
      .update(ClubEntity)
      .set({ is_wallet_depleted: isWalletDepleted })
      .where('ownerId = :ownerId', { ownerId })
      .execute();
  }
}
