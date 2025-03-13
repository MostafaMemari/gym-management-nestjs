import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateClub, IUpdateClub, ISearchClubQuery } from './interfaces/club.interface';
import { ClubPatterns } from './patterns/club.pattern';
import { ClubService } from './club.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';

@Controller()
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @MessagePattern(ClubPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(ClubPatterns.CreateClub)
  create(@Payload() data: { user: IUser; createClubDto: ICreateClub }) {
    const { user, createClubDto } = data;

    return this.clubService.create(user, createClubDto);
  }
  @MessagePattern(ClubPatterns.UpdateClub)
  update(@Payload() data: { user: IUser; clubId: number; updateClubDto: IUpdateClub }) {
    const { user, clubId, updateClubDto } = data;

    return this.clubService.update(user, clubId, updateClubDto);
  }
  @MessagePattern(ClubPatterns.GetClubs)
  findAll(@Payload() data: { user: IUser; queryClubDto: ISearchClubQuery; paginationDto: IPagination }) {
    const { user, queryClubDto, paginationDto } = data;

    return this.clubService.getAll(user, { queryClubDto, paginationDto });
  }
  @MessagePattern(ClubPatterns.GetClub)
  findOne(@Payload() data: { user: IUser; clubId: number }) {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }
  @MessagePattern(ClubPatterns.RemoveClub)
  remove(@Payload() data: { user: IUser; clubId: number }) {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }

  @MessagePattern(ClubPatterns.walletDepleted)
  updateWalletDepletionStatus(@Payload() data: { userId: number; isWalletDepleted: boolean }) {
    const { userId, isWalletDepleted } = data;

    return this.clubService.updateWalletDepletionStatus(userId, isWalletDepleted);
  }
}
