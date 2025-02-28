import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { ClubEntity } from '../entities/club.entity';
import { EntityName } from 'src/common/enums/entity.enum';
import { ICreateClub, IUpdateClub } from '../interfaces/club.interface';

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

  async getClubsWithFilters(userId: number, filters: any, page: number, take: number): Promise<[ClubEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Clubs).where('clubs.ownerId = :ownerId', { ownerId: userId });

    // if (filters?.search) {
    //   queryBuilder.andWhere('(coaches.full_name LIKE :search OR coaches.national_code LIKE :search)', { search: `%${filters.search}%` });
    // }
    // if (filters?.gender) {
    //   queryBuilder.andWhere('coaches.gender = :gender', { gender: filters?.gender });
    // }
    // if (filters?.is_active !== undefined) {
    //   queryBuilder.andWhere('coaches.is_active = :isActive', { isActive: filters?.is_active });
    // }

    // if (filters?.phone_number) {
    //   queryBuilder.andWhere('coaches.phone_number LIKE :phoneNumber', { phoneNumber: `%${filters?.phone_number}%` });
    // }

    // if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
    //   queryBuilder.orderBy(`coaches.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    // } else {
    //   queryBuilder.orderBy('coaches.created_at', 'DESC');
    // }

    // if (filters?.sort_by) {
    //   queryBuilder.orderBy(`coaches.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    // } else {
    //   queryBuilder.orderBy('coaches.updated_at', 'DESC');
    // }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findByIdAndOwner(clubId: number, ownerId: number): Promise<ClubEntity | null> {
    return this.findOne({ where: { id: clubId, ownerId } });
  }

  async findOwnedClubsByIds(clubIds: number[], ownerId: number): Promise<ClubEntity[]> {
    return this.find({
      where: { ownerId, id: In(clubIds) },
    });
  }
}
