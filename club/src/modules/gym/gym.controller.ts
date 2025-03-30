import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateGym, IUpdateGym, ISearchGymQuery } from './interfaces/gym.interface';
import { GymPatterns } from './patterns/gym.pattern';
import { GymService } from './gym.service';

import { CacheService } from '../cache/cache.service';

import { CacheKeys } from '../../common/enums/cache';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller()
export class GymController {
  constructor(private readonly gymService: GymService, private readonly cacheService: CacheService) {}

  @MessagePattern(GymPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(GymPatterns.CREATE)
  async create(@Payload() data: { user: IUser; createGymDto: ICreateGym }): Promise<ServiceResponse> {
    const { user, createGymDto } = data;

    const result = await this.gymService.create(user, createGymDto);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }
  @MessagePattern(GymPatterns.UPDATE)
  async update(@Payload() data: { user: IUser; gymId: number; updateGymDto: IUpdateGym }): Promise<ServiceResponse> {
    const { user, gymId, updateGymDto } = data;

    const result = await this.gymService.update(user, gymId, updateGymDto);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }
  @MessagePattern(GymPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryGymDto: ISearchGymQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryGymDto, paginationDto } = data;

    return this.gymService.getAll(user, { queryGymDto, paginationDto });
  }
  @MessagePattern(GymPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; gymId: number }): Promise<ServiceResponse> {
    const { user, gymId } = data;

    return this.gymService.findOneById(user, gymId);
  }
  @MessagePattern(GymPatterns.REMOVE)
  async remove(@Payload() data: { user: IUser; gymId: number }): Promise<ServiceResponse> {
    const { user, gymId } = data;

    const result = await this.gymService.removeById(user, gymId);
    if (!result.error) void this.clearCache(user.id);

    return result;
  }

  @MessagePattern(GymPatterns.WALLET_DEPLETED)
  updateWalletDepletionStatus(@Payload() data: { userId: number; isWalletDepleted: boolean }) {
    const { userId, isWalletDepleted } = data;

    return this.gymService.updateWalletDepletionStatus(userId, isWalletDepleted);
  }

  private async clearCache(ownerId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.GYMS}`.replace(':userId', ownerId.toString()) + '*');
  }
}
