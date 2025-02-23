import { BadRequestException, ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { In, Repository } from 'typeorm';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheService } from '../cache/cache.service';
import { CacheKeys, CachePatterns } from '../cache/enums/cache.enum';
import { ClubEntity } from './entities/club.entity';
import { ClubMessages } from './enums/club.message';
import { ICreateClub, IQuery, IUpdateClub } from './interfaces/club.interface';
import { IUser } from './interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';

@Injectable()
export class ClubService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(ClubEntity) private clubRepository: Repository<ClubEntity>,
    private readonly cacheService: CacheService,
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
      const club = this.clubRepository.create({ ...createClubDto, ownerId: user.id });
      await this.clubRepository.save(club);

      this.clearClubsCache();
      return ResponseUtil.success(club, ClubMessages.CreatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToCreateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateById(user: IUser, clubId: number, updateClubDto: IUpdateClub) {
    try {
      const club = await this.checkClubOwnership(clubId, user.id);

      const updatedClub = this.clubRepository.merge(club, { ...updateClubDto });
      await this.clubRepository.save(updatedClub);

      return ResponseUtil.success({ ...updatedClub }, ClubMessages.UpdatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToUpdateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(user: IUser, query: { queryDto: IQuery; paginationDto: IPagination }): Promise<PageDto<ClubEntity>> {
    const { take, page } = query.paginationDto;

    // const cacheKey = `${CacheKeys.CLUB_LIST}:user_${user.id}:page_${page}:take_${take}`;

    // const cachedData = await this.cacheService.get<PageDto<ClubEntity>>(cacheKey);
    // if (cachedData) return cachedData;

    const queryBuilder = this.clubRepository.createQueryBuilder(EntityName.Clubs);

    const [clubs, count] = await queryBuilder
      .where('clubs.ownerId = :ownerId', { ownerId: user.id })
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(clubs, pageMetaDto);

    // await this.cacheService.set(cacheKey, result, 1);

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
      await this.ensureClubHasNoRelations(clubId);

      const removedClub = await this.clubRepository.delete(clubId);

      if (removedClub.affected) return ResponseUtil.success(club, ClubMessages.RemovedClubSuccess);

      return ResponseUtil.success('club', ClubMessages.RemovedClubSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findClub(field: keyof ClubEntity, value: any, notFoundError = false, duplicateError = false) {
    const club = await this.clubRepository.findOneBy({ [field]: value });

    if (!club && notFoundError) throw new NotFoundException(ClubMessages.NotFoundClub);
    if (club && duplicateError) throw new ConflictException(ClubMessages.DuplicateNationalCode);

    return club;
  }
  async findClubById(clubId: number, { notFoundError = false }) {
    return this.findClub('id', clubId, notFoundError);
  }

  async clearClubsCache(): Promise<void> {
    await this.cacheService.delByPattern(CachePatterns.CLUB_LIST);
  }

  async findOwnedClubs(userId: number, clubIds: number[]): Promise<ClubEntity[]> {
    const ownedClubs = await this.clubRepository.find({
      where: { ownerId: userId, id: In(clubIds) },
    });

    if (ownedClubs.length !== clubIds.length) {
      const notOwnedClubIds = clubIds.filter((id) => !ownedClubs.some((club) => club.id === id));
      throw new BadRequestException(`${ClubMessages.UnauthorizedClubs} ${notOwnedClubIds.join(', ')}`);
    }

    return ownedClubs;
  }

  async checkClubOwnership(clubId: number, userId: number): Promise<ClubEntity> {
    const club = await this.clubRepository.findOne({ where: { id: clubId, ownerId: userId } });
    if (!club) throw new BadRequestException(ClubMessages.ClubNotBelongToUser);
    return club;
  }

  async ensureClubHasNoRelations(clubId: number): Promise<void> {
    const clubWithRelations = await this.clubRepository
      .createQueryBuilder('club')
      .leftJoin('club.coaches', 'coach')
      .leftJoin('club.students', 'student')
      .where('club.id = :clubId', { clubId })
      .andWhere('(coach.id IS NOT NULL OR student.id IS NOT NULL)')
      .getOne();

    if (clubWithRelations) throw new BadRequestException(ClubMessages.ClubHasRelations);
  }
}
