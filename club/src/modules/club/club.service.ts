import { ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';

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
import { ICreateClub, IClubQuery, IUpdateClub } from './interfaces/club.interface';

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

  async create(createClubDto: ICreateClub) {
    try {
      const club = this.clubRepository.create(createClubDto);
      await this.clubRepository.save(club);

      this.clearClubsCache();
      return ResponseUtil.success(club, ClubMessages.CreatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToCreateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async updateById(clubId: number, updateClubDto: IUpdateClub) {
    let updateData: Partial<ClubEntity> = {};

    try {
      const club = await this.findClubById(clubId, { notFoundError: true });

      Object.keys(updateClubDto).forEach((key) => {
        if (updateClubDto[key] !== undefined && updateClubDto[key] !== club[key]) {
          updateData[key] = updateClubDto[key];
        }
      });

      if (Object.keys(updateData).length > 0) {
        await this.clubRepository.update(clubId, updateData);
      }

      this.clearClubsCache();
      return ResponseUtil.success({ ...club, ...updateData }, ClubMessages.UpdatedClub);
    } catch (error) {
      return ResponseUtil.error(error?.message || ClubMessages.FailedToUpdateClub, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(query: IClubQuery): Promise<PageDto<ClubEntity>> {
    const { take, page } = query.paginationDto;
    const cacheKey = `${CacheKeys.CLUB_LIST}-${page}-${take}`;

    const cachedData = await this.cacheService.get<PageDto<ClubEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const queryBuilder = this.clubRepository.createQueryBuilder(EntityName.Clubs);

    const [clubs, count] = await queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(clubs, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 1);

    return result;
  }
  async findOneById(clubId: number): Promise<ServiceResponse> {
    try {
      const club = await this.findClubById(clubId, { notFoundError: true });

      return ResponseUtil.success(club, ClubMessages.RemovedClubSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(clubId: number): Promise<ServiceResponse> {
    try {
      const club = await this.findClubById(clubId, { notFoundError: true });

      const removedClub = await this.clubRepository.delete(club.id);

      if (removedClub.affected) {
        return ResponseUtil.success(club, ClubMessages.RemovedClubSuccess);
      }
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
}
