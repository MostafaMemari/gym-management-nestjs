import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateGym, IUpdateGym, ISearchGymQuery } from './interfaces/gym.interface';
import { GymPatterns } from './patterns/gym.pattern';
import { GymService } from './gym.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller()
export class GymController {
  constructor(private readonly gymService: GymService) {}

  @MessagePattern(GymPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(GymPatterns.CREATE)
  create(@Payload() data: { user: IUser; createGymDto: ICreateGym }): Promise<ServiceResponse> {
    const { user, createGymDto } = data;

    return this.gymService.create(user, createGymDto);
  }
  @MessagePattern(GymPatterns.UPDATE)
  update(@Payload() data: { user: IUser; gymId: number; updateGymDto: IUpdateGym }): Promise<ServiceResponse> {
    const { user, gymId, updateGymDto } = data;

    return this.gymService.update(user, gymId, updateGymDto);
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
  remove(@Payload() data: { user: IUser; gymId: number }): Promise<ServiceResponse> {
    const { user, gymId } = data;

    return this.gymService.findOneById(user, gymId);
  }

  @MessagePattern(GymPatterns.WALLET_DEPLETED)
  updateWalletDepletionStatus(@Payload() data: { userId: number; isWalletDepleted: boolean }) {
    const { userId, isWalletDepleted } = data;

    return this.gymService.updateWalletDepletionStatus(userId, isWalletDepleted);
  }
}
