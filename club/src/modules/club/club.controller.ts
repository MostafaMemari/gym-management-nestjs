import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateClub, IClubQuery, IUpdateClub } from './interfaces/club.interface';
import { ClubPatterns } from './patterns/club.pattern';
import { ClubService } from './club.service';

@Controller()
export class ClubController {
  constructor(private readonly clubService: ClubService) {}

  @MessagePattern(ClubPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(ClubPatterns.CreateClub)
  create(@Payload() data: { createClubDto: ICreateClub }) {
    const { createClubDto } = data;
    return this.clubService.create(createClubDto);
  }
  @MessagePattern(ClubPatterns.UpdateClub)
  update(@Payload() data: { clubId: number; updateClubDto: IUpdateClub }) {
    const { clubId, updateClubDto } = data;
    return this.clubService.updateById(clubId, updateClubDto);
  }

  @MessagePattern(ClubPatterns.GetClubs)
  findAll(@Payload() query: IClubQuery) {
    return this.clubService.getAll(query);
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
