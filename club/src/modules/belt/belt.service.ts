import { Injectable, NotFoundException } from '@nestjs/common';

import { BeltEntity } from './entities/belt.entity';
import { BeltMessages } from './enums/belt.message';
import { IBeltCreateDto, IBeltFilter, IBeltUpdateDto } from './interfaces/belt.interface';
import { BeltRepository } from './repositories/belt.repository';

import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class BeltService {
  constructor(private readonly beltRepository: BeltRepository, private readonly cacheService: CacheService) {}

  async create(createBeltDto: IBeltCreateDto): Promise<ServiceResponse> {
    try {
      const { nextBeltIds } = createBeltDto;
      if (nextBeltIds) {
        const nextBelt = await this.validateBeltIds(nextBeltIds);
        createBeltDto.nextBelt = nextBelt;
      }

      const belt = await this.beltRepository.createAndSaveBelt(createBeltDto);

      return ResponseUtil.success(belt, BeltMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(beltId: number, updateBeltDto: IBeltUpdateDto): Promise<ServiceResponse> {
    try {
      const { nextBeltIds } = updateBeltDto;
      const belt = await this.findBeltByIdOrThrow(beltId);

      if (nextBeltIds) {
        const nextBelt = await this.validateBeltIds(nextBeltIds);
        updateBeltDto.nextBelt = nextBelt;
      }

      const updatedBelt = await this.beltRepository.updateBelt(belt, updateBeltDto);

      return ResponseUtil.success({ ...updatedBelt }, BeltMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryBeltDto: IBeltFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const cacheKey = `${CacheKeys.BELT_LIST}-${page}-${take}-${JSON.stringify(query.queryBeltDto)}`;

      const cachedData = await this.cacheService.get<Promise<ServiceResponse>>(cacheKey);
      if (cachedData) return cachedData;

      const [belts, count] = await this.beltRepository.getBeltsWithFilters(query.queryBeltDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(belts, pageMetaDto);

      await this.cacheService.set(cacheKey, result, 600);

      return ResponseUtil.success(result, BeltMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(beltId: number): Promise<ServiceResponse> {
    try {
      const belt = await this.findBeltByIdOrThrow(beltId);

      return ResponseUtil.success(belt, BeltMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(beltId: number): Promise<ServiceResponse> {
    try {
      const belt = await this.findBeltByIdOrThrow(beltId);

      const removedBelt = await this.beltRepository.delete(beltId);

      if (removedBelt.affected) return ResponseUtil.success(belt, BeltMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async findBeltByIdOrThrow(beltId: number): Promise<BeltEntity> {
    const belt = await this.beltRepository.findOneBy({ id: beltId });
    if (!belt) throw new NotFoundException(BeltMessages.NOT_FOUND);
    return belt;
  }

  async findBeltWithRelationsOrThrow(beltId: number): Promise<BeltEntity> {
    const belt = await this.beltRepository.findOne({ where: { id: beltId }, relations: ['nextBelt'] });
    if (!belt) throw new NotFoundException(BeltMessages.NOT_FOUND);
    return belt;
  }

  async validateBeltIds(beltIds: number[]): Promise<BeltEntity[]> {
    const foundBelts = await this.beltRepository.findByIds(beltIds);
    const foundIds = foundBelts.map((belt) => belt.id);
    const invalidIds = beltIds.filter((id) => !foundIds.includes(id));

    if (invalidIds.length > 0) {
      throw new NotFoundException(BeltMessages.MULTIPLE_NOT_FOUND.replace('{ids}', invalidIds.join(', ')));
    }

    return foundBelts;
  }

  async getNamesAndIds() {
    return await this.beltRepository.getBeltNamesAndIds();
  }
}
