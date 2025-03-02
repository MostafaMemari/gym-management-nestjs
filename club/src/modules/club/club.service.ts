import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { In, Repository } from 'typeorm';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheService } from '../cache/cache.service';
import { CacheKeys, CachePatterns } from '../../common/enums/cache.enum';
import { ClubEntity } from './entities/club.entity';
import { ClubMessages } from './enums/club.message';
import { ICreateClub, ISearchClubQuery, IUpdateClub } from './interfaces/club.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { CoachEntity } from '../coach/entities/coach.entity';
import { Gender } from '../../common/enums/gender.enum';
import { CoachService } from '../coach/coach.service';
import { ClubRepository } from './repositories/club.repository';

@Injectable()
export class ClubService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly clubRepository: ClubRepository,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  async create(user: IUser, createClubDto: ICreateClub) {
    try {
      const club = await this.clubRepository.createAndSaveClub(createClubDto, user.id);

      return ResponseUtil.success(club, ClubMessages.CreatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToCreateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async update(user: IUser, clubId: number, updateClubDto: IUpdateClub) {
    try {
      const { genders } = updateClubDto;
      const club = await this.checkClubOwnership(clubId, user.id);

      if (genders && genders !== club.genders) {
        await this.checkGenderRemoval(genders, clubId, club.genders);
      }

      const updatedClub = await this.clubRepository.updateClub(club, updateClubDto);

      return ResponseUtil.success({ ...updatedClub }, ClubMessages.UpdatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToUpdateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getAll(user: IUser, query: { queryClubDto: ISearchClubQuery; paginationDto: IPagination }): Promise<PageDto<ClubEntity>> {
    const { take, page } = query.paginationDto;

    const cacheKey = `${CacheKeys.CLUB_LIST}-${user.id}-${page}-${take}-${JSON.stringify(query.queryClubDto)}`;

    const cachedData = await this.cacheService.get<PageDto<ClubEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [clubs, count] = await this.clubRepository.getClubsWithFilters(user.id, query.queryClubDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(clubs, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(user: IUser, clubId: number): Promise<ServiceResponse> {
    try {
      const club = await this.checkClubOwnership(clubId, user.id);

      return ResponseUtil.success(club, ClubMessages.GetClubSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, clubId: number): Promise<ServiceResponse> {
    try {
      const club = await this.checkClubOwnership(clubId, user.id);

      const isClubAssignedToCoaches = await this.coachService.isClubAssignedToCoaches(clubId);
      if (isClubAssignedToCoaches) throw new BadRequestException(ClubMessages.CannotRemoveClubAssignedToCoaches);

      const removedClub = await this.clubRepository.delete(clubId);

      if (removedClub.affected) return ResponseUtil.success(club, ClubMessages.RemovedClubSuccess);

      return ResponseUtil.success('club', ClubMessages.RemovedClubSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async checkClubOwnership(clubId: number, userId: number): Promise<ClubEntity> {
    const club = await this.clubRepository.findByIdAndOwner(clubId, userId);
    if (!club) throw new BadRequestException(ClubMessages.ClubNotBelongToUser);
    return club;
  }
  async checkGenderRemoval(genders: Gender[], clubId: number, currentGenders: Gender[]): Promise<void> {
    const removedGenders = currentGenders.filter((gender) => !genders.includes(gender));

    if (removedGenders.includes(Gender.Male)) {
      const maleCoachExists = await this.coachService.isGenderAssignedToCoaches(clubId, Gender.Male);
      if (maleCoachExists) throw new BadRequestException(ClubMessages.CannotRemoveMaleCoach);
    }

    if (removedGenders.includes(Gender.Female)) {
      const femaleCoachExists = await this.coachService.isGenderAssignedToCoaches(clubId, Gender.Female);
      if (femaleCoachExists) throw new BadRequestException(ClubMessages.CannotRemoveFemaleCoach);
    }
  }
  async clearClubsCache(): Promise<void> {
    await this.cacheService.delByPattern(CachePatterns.CLUB_LIST);
  }
  async findOwnedClubs(clubIds: number[], userId: number): Promise<ClubEntity[]> {
    const ownedClubs = await this.clubRepository.findOwnedClubsByIds(clubIds, userId);

    if (ownedClubs.length !== clubIds.length) {
      const notOwnedClubIds = clubIds.filter((id) => !ownedClubs.some((club) => club.id === id));
      throw new BadRequestException(`${ClubMessages.UnauthorizedClubs} ${notOwnedClubIds.join(', ')}`);
    }

    return ownedClubs;
  }
}
