import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { ClubEntity } from './entities/club.entity';
import { ClubMessages } from './enums/club.message';
import { ICreateClub, ISearchClubQuery, IUpdateClub } from './interfaces/club.interface';
import { ClubRepository } from './repositories/club.repository';

import { CacheService } from '../cache/cache.service';
import { CoachService } from '../coach/coach.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Gender } from '../../common/enums/gender.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheKeys } from 'src/common/enums/cache';

@Injectable()
export class ClubService {
  constructor(
    private readonly clubRepository: ClubRepository,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async create(user: IUser, createClubDto: ICreateClub): Promise<ServiceResponse> {
    const userId = user.id;
    try {
      const club = await this.clubRepository.createAndSaveClub(createClubDto, userId);

      return ResponseUtil.success(club, ClubMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ClubMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(user: IUser, clubId: number, updateClubDto: IUpdateClub): Promise<ServiceResponse> {
    const userId = user.id;
    try {
      const { genders } = updateClubDto;
      const club = await this.validateOwnershipById(clubId, userId);

      if (genders && genders !== club.genders) {
        await this.validateGenderRemoval(genders, clubId, club.genders);
      }

      const updatedClub = await this.clubRepository.updateClub(club, updateClubDto);

      return ResponseUtil.success({ ...updatedClub }, ClubMessages.UPDATE_FAILURE);
    } catch (error) {
      ResponseUtil.error(error?.message || ClubMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(user: IUser, query: { queryClubDto: ISearchClubQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [clubs, count] = await this.clubRepository.getClubsWithFilters(user.id, query.queryClubDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(clubs, pageMetaDto);

      return ResponseUtil.success(result.data, ClubMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ClubMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, clubId: number): Promise<ServiceResponse> {
    try {
      const club = await this.validateOwnershipById(clubId, user.id);

      return ResponseUtil.success(club, ClubMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ClubMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(user: IUser, clubId: number): Promise<ServiceResponse> {
    const userId = user.id;

    try {
      const club = await this.validateOwnershipById(clubId, userId);

      const isClubAssignedToCoaches = await this.coachService.hasCoachByClubId(clubId);
      if (isClubAssignedToCoaches) throw new BadRequestException(ClubMessages.CANNOT_REMOVE_ASSIGNED_COACHES);

      await this.clubRepository.remove(club);

      return ResponseUtil.success(club, ClubMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || ClubMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async updateWalletDepletionStatus(ownerId: number, isWalletDepleted: boolean): Promise<ServiceResponse> {
    try {
      const clubs = await this.clubRepository.findByOwnerId(ownerId);
      if (!clubs || clubs.length === 0) throw new BadRequestException(ClubMessages.NOT_FOUND);

      await this.clubRepository.setWalletDepletionByOwnerId(ownerId, isWalletDepleted);

      return ResponseUtil.success(null, ClubMessages.WALLET_DEPLETION_UPDATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async validateOwnershipById(clubId: number, userId: number): Promise<ClubEntity> {
    const club = await this.clubRepository.findByIdAndOwner(clubId, userId);
    if (!club) throw new NotFoundException(ClubMessages.NOT_BELONG_TO_USER);
    return club;
  }
  async validateOwnershipByIdWithCoaches(clubId: number, userId: number): Promise<ClubEntity> {
    const club = await this.clubRepository.findByIdAndOwnerRelationCoaches(clubId, userId);
    if (!club) throw new NotFoundException(ClubMessages.NOT_BELONG_TO_USER);
    return club;
  }
  async validateGenderRemoval(genders: Gender[], clubId: number, currentGenders: Gender[]): Promise<void> {
    const removedGenders = currentGenders.filter((gender) => !genders.includes(gender));

    if (removedGenders.includes(Gender.Male)) {
      const maleCoachExists = await this.coachService.hasCoachWithGenderInClub(clubId, Gender.Male);
      if (maleCoachExists) throw new BadRequestException(ClubMessages.CANNOT_REMOVE_MALE_COACH);
    }

    if (removedGenders.includes(Gender.Female)) {
      const femaleCoachExists = await this.coachService.hasCoachWithGenderInClub(clubId, Gender.Female);
      if (femaleCoachExists) throw new BadRequestException(ClubMessages.CANNOT_REMOVE_FEMALE_COACH);
    }
  }
  async validateOwnershipByIds(clubIds: number[], userId: number): Promise<ClubEntity[]> {
    const ownedClubs = await this.clubRepository.findOwnedClubsByIds(clubIds, userId);

    if (ownedClubs.length !== clubIds.length) {
      const notOwnedClubIds = clubIds.filter((id) => !ownedClubs.some((club) => club.id === id));
      throw new BadRequestException(ClubMessages.CLUBS_NOT_OWNED_BY_USER.replace('{ids}', notOwnedClubIds.join(', ')));
    }

    return ownedClubs;
  }
  async validateCoachInClub(club: ClubEntity, coachId: number): Promise<void> {
    const coach = club.coaches.find((coach) => coach.id === coachId);
    if (!coach) throw new BadRequestException(ClubMessages.COACH_NOT_ASSIGNED);
  }
}
