import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateClub, IUpdateClub, ISearchClubQuery } from './interfaces/club.interface';
import { ClubPatterns } from './patterns/club.pattern';
import { ClubService } from './club.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';

@Controller()
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @MessagePattern(ClubPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(ClubPatterns.CREATE)
  create(@Payload() data: { user: IUser; createClubDto: ICreateClub }): Promise<ServiceResponse> {
    const { user, createClubDto } = data;

    return this.clubService.create(user, createClubDto);
  }
  @MessagePattern(ClubPatterns.UPDATE)
  update(@Payload() data: { user: IUser; clubId: number; updateClubDto: IUpdateClub }): Promise<ServiceResponse> {
    const { user, clubId, updateClubDto } = data;

    return this.clubService.update(user, clubId, updateClubDto);
  }
  @MessagePattern(ClubPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; queryClubDto: ISearchClubQuery; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, queryClubDto, paginationDto } = data;

    return this.clubService.getAll(user, { queryClubDto, paginationDto });
  }
  @MessagePattern(ClubPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; clubId: number }): Promise<ServiceResponse> {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }
  @MessagePattern(ClubPatterns.REMOVE)
  remove(@Payload() data: { user: IUser; clubId: number }): Promise<ServiceResponse> {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }

  @MessagePattern(ClubPatterns.WALLET_DEPLETED)
  updateWalletDepletionStatus(@Payload() data: { userId: number; isWalletDepleted: boolean }) {
    const { userId, isWalletDepleted } = data;

    return this.clubService.updateWalletDepletionStatus(userId, isWalletDepleted);
  }
}
