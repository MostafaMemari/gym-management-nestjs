import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateSession, IUpdateSession, ISearchSessionQuery } from './interfaces/session.interface';
import { SessionPatterns } from './patterns/session.pattern';
import { SessionService } from './session.service';
import { IUser } from '../../common/interfaces/user.interface';
import { IPagination } from '../../common/interfaces/pagination.interface';

@Controller()
export class SessionController {
  constructor(private readonly clubService: SessionService) {}

  @MessagePattern(SessionPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(SessionPatterns.CreateSession)
  create(@Payload() data: { user: IUser; createSessionDto: ICreateSession }) {
    const { user, createSessionDto } = data;

    return this.clubService.create(user, createSessionDto);
  }
  @MessagePattern(SessionPatterns.UpdateSession)
  update(@Payload() data: { user: IUser; clubId: number; updateSessionDto: IUpdateSession }) {
    const { user, clubId, updateSessionDto } = data;

    return this.clubService.update(user, clubId, updateSessionDto);
  }

  @MessagePattern(SessionPatterns.GetSessions)
  findAll(@Payload() data: { user: IUser; querySessionDto: ISearchSessionQuery; paginationDto: IPagination }) {
    const { user, querySessionDto, paginationDto } = data;

    return this.clubService.getAll(user, { querySessionDto, paginationDto });
  }

  @MessagePattern(SessionPatterns.GetSession)
  findOne(@Payload() data: { user: IUser; clubId: number }) {
    const { user, clubId } = data;

    return this.clubService.findOneById(user, clubId);
  }
}
