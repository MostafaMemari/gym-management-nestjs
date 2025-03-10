import { HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { BeltExamEntity } from './entities/belt-exam.entity';
import { BeltExamMessages } from './enums/belt-exam.message';
import { IBeltCreateDtoExam, ISearchBeltExamQuery, IBeltUpdateDtoExam } from './interfaces/belt-exam.interface';
import { BeltExamRepository } from './repositories/belt-exam.repository';

import { CacheService } from '../cache/cache.service';
import { BeltService } from '../belt/belt.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheKeys } from './enums/cache.enum';

@Injectable()
export class BeltExamService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly beltExamRepository: BeltExamRepository,
    private readonly cacheService: CacheService,
    private readonly beltService: BeltService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  async create(createBeltExamDto: IBeltCreateDtoExam) {
    try {
      const { beltIds } = createBeltExamDto;
      if (beltIds) {
        const belts = await this.beltService.validateBeltIds(beltIds);
        createBeltExamDto.belts = belts;
      }

      const beltExam = await this.beltExamRepository.createAndSaveBeltExam(createBeltExamDto);

      return ResponseUtil.success(beltExam, BeltExamMessages.CREATE_SUCCESS);
    } catch (error) {
      return ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(beltExamId: number, updateBeltExamDto: IBeltUpdateDtoExam) {
    try {
      const { beltIds } = updateBeltExamDto;

      const beltExam = await this.validateBeltExamId(beltExamId);

      if (beltIds) {
        const belts = await this.beltService.validateBeltIds(beltIds);
        updateBeltExamDto.belts = belts;
      }

      const updatedBeltExam = await this.beltExamRepository.updateBeltExam(beltExam, updateBeltExamDto);

      return ResponseUtil.success({ ...updatedBeltExam }, BeltExamMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(query: { queryBeltExamDto: ISearchBeltExamQuery; paginationDto: IPagination }): Promise<PageDto<BeltExamEntity>> {
    const { take, page } = query.paginationDto;
    try {
      const cacheKey = `${CacheKeys.BELT_EXAMS}-${page}-${take}-${JSON.stringify(query.queryBeltExamDto)}`;
      const cachedData = await this.cacheService.get<Promise<ServiceResponse>>(cacheKey);
      if (cachedData) return cachedData;

      const [beltExams, count] = await this.beltExamRepository.getBeltExamsWithFilters(query.queryBeltExamDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(beltExams, pageMetaDto);

      await this.cacheService.set(cacheKey, result, 600);

      return result;
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async findOneById(beltExamId: number): Promise<ServiceResponse> {
    try {
      const beltExam = await this.validateBeltExamId(beltExamId);

      return ResponseUtil.success(beltExam, BeltExamMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }
  async removeById(beltExamId: number): Promise<ServiceResponse> {
    try {
      const beltExam = await this.validateBeltExamId(beltExamId);

      const removedBeltExam = await this.beltExamRepository.delete(beltExamId);

      if (removedBeltExam.affected) return ResponseUtil.success(beltExam, BeltExamMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || BeltExamMessages.CREATE_FAILURE, error?.status);
    }
  }

  async validateBeltExamId(beltExamId: number): Promise<BeltExamEntity> {
    const beltExam = await this.beltExamRepository.findOneBy({ id: beltExamId });
    if (!beltExam) throw new NotFoundException(BeltExamMessages.NOT_FOUND);
    return beltExam;
  }
}
