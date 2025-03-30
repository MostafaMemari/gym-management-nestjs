import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

import { GymEntity } from './entities/gym.entity';
import { GymMessages } from './enums/gym.message';
import { ICreateGym, ISearchGymQuery, IUpdateGym } from './interfaces/gym.interface';
import { GymRepository } from './repositories/gym.repository';

import { CoachService } from '../coach/coach.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Gender } from '../../common/enums/gender.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class GymService {
  constructor(
    private readonly gymRepository: GymRepository,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async create(user: IUser, createGymDto: ICreateGym): Promise<ServiceResponse> {
    try {
      const gym = await this.gymRepository.createAndSave(createGymDto, user.id);

      return ResponseUtil.success(gym, GymMessages.CREATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || GymMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(user: IUser, gymId: number, updateGymDto: IUpdateGym): Promise<ServiceResponse> {
    try {
      const { genders } = updateGymDto;
      const gym = await this.validateOwnershipById(gymId, user.id);

      if (genders && genders !== gym.genders) {
        await this.validateGenderRemoval(genders, gymId, gym.genders);
      }

      const updatedGym = await this.gymRepository.updateMergeAndSave(gym, updateGymDto);

      return ResponseUtil.success({ ...updatedGym }, GymMessages.UPDATE_FAILURE);
    } catch (error) {
      ResponseUtil.error(error?.message || GymMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(user: IUser, query: { queryGymDto: ISearchGymQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [gyms, count] = await this.gymRepository.getGymsWithFilters(user.id, query.queryGymDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(gyms, pageMetaDto);

      return ResponseUtil.success(result.data, GymMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || GymMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, gymId: number): Promise<ServiceResponse> {
    try {
      const gym = await this.validateOwnershipById(gymId, user.id);

      return ResponseUtil.success(gym, GymMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || GymMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(user: IUser, gymId: number): Promise<ServiceResponse> {
    try {
      const gym = await this.validateOwnershipById(gymId, user.id);

      const isGymAssignedToCoaches = await this.coachService.hasCoachByGymId(gymId);
      if (isGymAssignedToCoaches) throw new BadRequestException(GymMessages.CANNOT_REMOVE_ASSIGNED_COACHES);

      await this.gymRepository.removeGym(gym);

      return ResponseUtil.success(gym, GymMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || GymMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async updateWalletDepletionStatus(ownerId: number, isWalletDepleted: boolean): Promise<ServiceResponse> {
    try {
      const gyms = await this.gymRepository.findByOwnerId(ownerId);
      if (!gyms || gyms.length === 0) throw new BadRequestException(GymMessages.NOT_FOUND);

      await this.gymRepository.setWalletDepletionByOwnerId(ownerId, isWalletDepleted);

      return ResponseUtil.success(null, GymMessages.WALLET_DEPLETION_UPDATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async validateOwnershipById(gymId: number, userId: number): Promise<GymEntity> {
    const gym = await this.gymRepository.findByIdAndOwner(gymId, userId);
    if (!gym) throw new NotFoundException(GymMessages.NOT_BELONG_TO_USER);
    return gym;
  }
  async checkGymAndCoachEligibility(gymId: number, coachId: number, gender: Gender): Promise<GymEntity> {
    return await this.gymRepository.validateGymOwnershipAndCoachGender(gymId, coachId, gender);
  }
  async validateOwnershipByIdWithCoaches(gymId: number, userId: number): Promise<GymEntity> {
    const gym = await this.gymRepository.findByIdAndOwnerRelationCoaches(gymId, userId);
    if (!gym) throw new NotFoundException(GymMessages.NOT_BELONG_TO_USER);
    return gym;
  }
  async validateGenderRemoval(genders: Gender[], gymId: number, currentGenders: Gender[]): Promise<void> {
    const removedGenders = currentGenders.filter((gender) => !genders.includes(gender));

    if (removedGenders.includes(Gender.Male)) {
      const maleCoachExists = await this.coachService.hasCoachWithGenderInGym(gymId, Gender.Male);
      if (maleCoachExists) throw new BadRequestException(GymMessages.CANNOT_REMOVE_MALE_COACH);
    }

    if (removedGenders.includes(Gender.Female)) {
      const femaleCoachExists = await this.coachService.hasCoachWithGenderInGym(gymId, Gender.Female);
      if (femaleCoachExists) throw new BadRequestException(GymMessages.CANNOT_REMOVE_FEMALE_COACH);
    }
  }
  async validateOwnershipByIds(gymIds: number[], userId: number): Promise<GymEntity[]> {
    const ownedGyms = await this.gymRepository.findOwnedGymsByIds(gymIds, userId);

    if (ownedGyms.length !== gymIds.length) {
      const notOwnedGymIds = gymIds.filter((id) => !ownedGyms.some((gym) => gym.id === id));
      throw new BadRequestException(GymMessages.CLUBS_NOT_OWNED_BY_USER.replace('{ids}', notOwnedGymIds.join(', ')));
    }

    return ownedGyms;
  }
  async validateCoachInGym(gym: GymEntity, coachId: number): Promise<void> {
    const coach = gym.coaches.find((coach) => coach.id === coachId);
    if (!coach) throw new BadRequestException(GymMessages.COACH_NOT_ASSIGNED);
  }
}
