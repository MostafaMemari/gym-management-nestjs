import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { AgeCategoryEntity } from './entities/age-category.entity';
import { AgeCategoryMessages } from './enums/age-category.message';
import { ICreateAgeCategory, ISearchAgeCategoryQuery, IUpdateAgeCategory } from './interfaces/age-category.interface';
import { AgeCategoryRepository } from './repositories/age-category.repository';

import { CacheService } from '../cache/cache.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class AgeCategoryService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly ageCategoryRepository: AgeCategoryRepository,
    private readonly cacheService: CacheService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(createAgeCategoryDto: ICreateAgeCategory) {
    try {
      const ageCategory = await this.ageCategoryRepository.createAndSaveAgeCategory(createAgeCategoryDto);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.CreatedAgeCategory);
    } catch (error) {
      return ResponseUtil.error(
        error?.message || AgeCategoryMessages.FailedToCreateAgeCategory,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async update(ageCategoryId: number, updateAgeCategoryDto: IUpdateAgeCategory) {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);

      const updatedAgeCategory = await this.ageCategoryRepository.updateAgeCategory(ageCategory, updateAgeCategoryDto);

      return ResponseUtil.success({ ...updatedAgeCategory }, AgeCategoryMessages.UpdatedAgeCategory);
    } catch (error) {
      return ResponseUtil.error(
        error?.message || AgeCategoryMessages.FailedToUpdateAgeCategory,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAll(query: { queryAgeCategoryDto: ISearchAgeCategoryQuery; paginationDto: IPagination }): Promise<PageDto<AgeCategoryEntity>> {
    const { take, page } = query.paginationDto;

    // const cacheKey = `${CacheKeys.BELT_LIST}-${page}-${take}-${JSON.stringify(query.queryAgeCategoryDto)}`;

    // const cachedData = await this.cacheService.get<PageDto<AgeCategoryEntity>>(cacheKey);
    // if (cachedData) return cachedData;

    const [ageCategories, count] = await this.ageCategoryRepository.getAgeCategoriesWithFilters(query.queryAgeCategoryDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(ageCategories, pageMetaDto);

    // await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);

      return ResponseUtil.success(ageCategory, AgeCategoryMessages.GetAgeCategorySuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(ageCategoryId: number): Promise<ServiceResponse> {
    try {
      const ageCategory = await this.validateAgeCategoryId(ageCategoryId);
      const removedAgeCategory = await this.ageCategoryRepository.delete(ageCategoryId);

      if (removedAgeCategory.affected) return ResponseUtil.success(ageCategory, AgeCategoryMessages.RemovedAgeCategorySuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async validateAgeCategoryId(ageCategoryId: number): Promise<AgeCategoryEntity> {
    const ageCategory = await this.ageCategoryRepository.findOneBy({ id: ageCategoryId });
    if (!ageCategory) throw new NotFoundException(AgeCategoryMessages.NotFoundAgeCategory);
    return ageCategory;
  }
}
