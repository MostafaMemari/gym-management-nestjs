import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateSession, ISessionFilter, IUpdateSession } from './interfaces/session.interface';
import { SessionPatterns } from './patterns/session.pattern';
import { SessionService } from './session.service';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class SessionController {
  constructor(private readonly clubService: SessionService) {}

  @MessagePattern(SessionPatterns.CHECK_CONNECTION)
  checkConnection() {
    return true;
  }

  @MessagePattern(SessionPatterns.CREATE)
  create(@Payload() data: { user: IUser; createSessionDto: ICreateSession }): Promise<ServiceResponse> {
    const { user, createSessionDto } = data;

    return this.clubService.create(user, createSessionDto);
  }
  @MessagePattern(SessionPatterns.UPDATE)
  update(@Payload() data: { user: IUser; sessionId: number; updateSessionDto: IUpdateSession }): Promise<ServiceResponse> {
    const { user, sessionId, updateSessionDto } = data;

    return this.clubService.update(user, sessionId, updateSessionDto);
  }
  @MessagePattern(SessionPatterns.GET_ALL)
  findAll(@Payload() data: { user: IUser; querySessionDto: ISessionFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { user, querySessionDto, paginationDto } = data;

    return this.clubService.getAll(user, { querySessionDto, paginationDto });
  }
  @MessagePattern(SessionPatterns.GET_ONE)
  findOne(@Payload() data: { user: IUser; sessionId: number }): Promise<ServiceResponse> {
    const { user, sessionId } = data;

    return this.clubService.findOneById(user, sessionId);
  }
  @MessagePattern(SessionPatterns.REMOVE)
  remove(@Payload() data: { user: IUser; sessionId: number }): Promise<ServiceResponse> {
    const { user, sessionId } = data;

    return this.clubService.removeById(user, sessionId);
  }
}
