import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { BeltEntity } from './entities/belt.entity';
import { BeltMessages } from './enums/belt.message';
import { ICreateBelt, ISearchBeltQuery, IUpdateBelt } from './interfaces/belt.interface';
import { BeltRepository } from './repositories/belt.repository';

import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class BeltService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly beltRepository: BeltRepository,
    private readonly cacheService: CacheService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  async create(createBeltDto: ICreateBelt) {
    try {
      const { nextBeltIds } = createBeltDto;
      if (nextBeltIds) {
        const nextBelt = await this.validateBeltIds(nextBeltIds);
        createBeltDto.nextBelt = nextBelt;
      }

      const belt = await this.beltRepository.createAndSaveBelt(createBeltDto);

      return ResponseUtil.success(belt, BeltMessages.CreatedBelt);
    } catch (error) {
      return ResponseUtil.error(error?.message || BeltMessages.FailedToCreateBelt, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async update(beltId: number, updateBeltDto: IUpdateBelt) {
    try {
      const { nextBeltIds } = updateBeltDto;
      const belt = await this.validateBeltId(beltId);

      if (nextBeltIds) {
        const nextBelt = await this.validateBeltIds(nextBeltIds);
        updateBeltDto.nextBelt = nextBelt;
      }

      const updatedBelt = await this.beltRepository.updateBelt(belt, updateBeltDto);

      return ResponseUtil.success({ ...updatedBelt }, BeltMessages.UpdatedBelt);
    } catch (error) {
      return ResponseUtil.error(error?.message || BeltMessages.FailedToUpdateBelt, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getAll(query: { queryBeltDto: ISearchBeltQuery; paginationDto: IPagination }): Promise<PageDto<BeltEntity>> {
    const { take, page } = query.paginationDto;

    // const cacheKey = `${CacheKeys.BELT_LIST}-${page}-${take}-${JSON.stringify(query.queryBeltDto)}`;

    // const cachedData = await this.cacheService.get<PageDto<BeltEntity>>(cacheKey);
    // if (cachedData) return cachedData;

    const [belts, count] = await this.beltRepository.getBeltsWithFilters(query.queryBeltDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(belts, pageMetaDto);

    // await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(beltId: number): Promise<ServiceResponse> {
    try {
      const belt = await this.validateBeltId(beltId);

      return ResponseUtil.success(belt, BeltMessages.GetBeltSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(beltId: number): Promise<ServiceResponse> {
    try {
      const belt = await this.validateBeltId(beltId);

      const removedBelt = await this.beltRepository.delete(beltId);

      if (removedBelt.affected) return ResponseUtil.success(belt, BeltMessages.RemovedBeltSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async validateBeltId(beltId: number): Promise<BeltEntity> {
    const belt = await this.beltRepository.findOneBy({ id: beltId });
    if (!belt) throw new NotFoundException(BeltMessages.NotFoundBelt);
    return belt;
  }

  async validateBeltIds(beltIds: number[]): Promise<BeltEntity[]> {
    const foundBelts = await this.beltRepository.findByIds(beltIds);
    const foundIds = foundBelts.map((belt) => belt.id);
    const invalidIds = beltIds.filter((id) => !foundIds.includes(id));

    if (invalidIds.length > 0) {
      throw new NotFoundException(BeltMessages.BeltNotFound.replace('{ids}', invalidIds.join(', ')));
    }

    return foundBelts;
  }
}
