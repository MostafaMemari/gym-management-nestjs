import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { CoachService } from './coach.service';
import { ICoachCreateDto, ICoachFilter, ICoachUpdateDto } from './interfaces/coach.interface';
import { CoachPatterns } from './patterns/coach.pattern';

import { CacheService } from '../cache/cache.service';

import { CacheKeys } from '../../common/enums/cache';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class CoachController {
  constructor(private readonly coachService: CoachService, private readonly cacheService: CacheService) {}

  @MessagePattern(CoachPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(CoachPatterns.CREATE)
  async create(@Payload() data: { user: IUser; createCoachDto: ICoachCreateDto }): Promise<ServiceResponse> {
    const { user, createCoachDto } = data;

    const result = await this.coachService.create(user.id, createCoachDto);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }
  @MessagePattern(CoachPatterns.UPDATE)
  async update(@Payload() data: { user: IUser; coachId: number; updateCoachDto: ICoachUpdateDto }): Promise<ServiceResponse> {
    const { user, coachId, updateCoachDto } = data;

    const result = await this.coachService.update(user.id, coachId, updateCoachDto);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }
  @MessagePattern(CoachPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryCoachDto: ICoachFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryCoachDto, paginationDto } = data;

    return this.coachService.getAll(user.id, { queryCoachDto, paginationDto });
  }

  

  
  @MessagePattern(CoachPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; coachId: number }): Promise<ServiceResponse> {
    const { user, coachId } = data;

    return this.coachService.findOneById(user.id, coachId);
  }
  @MessagePattern(CoachPatterns.REMOVE)
  async remove(@Payload() data: { user: IUser; coachId: number }): Promise<ServiceResponse> {
    const { user, coachId } = data;

    const result = await this.coachService.removeById(user.id, coachId);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }
  @MessagePattern(CoachPatterns.GET_BY_NATIONAL_CODE)
  getByNationalCode(@Payload() data: { nationalCode: string }): Promise<ServiceResponse> {
    const { nationalCode } = data;

    return this.coachService.getOneByNationalCode(nationalCode);
  }

  private async clearCache(ownerId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.COACHES}`.replace(':userId', ownerId.toString()) + '*');
  }
}
