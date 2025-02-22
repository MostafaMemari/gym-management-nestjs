import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateClub, IUpdateClub, IQuery } from './interfaces/club.interface';
import { ClubPatterns } from './patterns/club.pattern';
import { ClubService } from './club.service';
import { IUser } from './interfaces/user.interface';
import { IPagination } from 'src/common/interfaces/pagination.interface';

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
  update(@Payload() data: { clubId: number; updateClubDto: IUpdateClub }) {
    const { clubId, updateClubDto } = data;
    return this.clubService.updateById(clubId, updateClubDto);
  }

  @MessagePattern(ClubPatterns.GetClubs)
  findAll(@Payload() data: { user: IUser; queryDto: IQuery; paginationDto: IPagination }) {
    const { user, queryDto, paginationDto } = data;

    return this.clubService.getAll(user, { queryDto, paginationDto });
  }

  @MessagePattern(ClubPatterns.RemoveUserClub)
  findOne(@Payload() data: { clubId: number }) {
    const { clubId } = data;
    return this.clubService.findOneById(clubId);
  }

  @MessagePattern(ClubPatterns.GetClub)
  remove(@Payload() data: { clubId: number }) {
    const { clubId } = data;
    return this.clubService.removeById(clubId);
  }

  @MessagePattern(ClubPatterns.checkExistClubById)
  checkExistById(@Payload() data: { clubId: number }) {
    return this.clubService.findClubById(data.clubId, {});
  }
}
