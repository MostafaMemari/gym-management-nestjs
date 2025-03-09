import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { SessionEntity } from './entities/session.entity';
import { SessionMessages } from './enums/session.message';
import { ICreateSession, ISearchSessionQuery, IUpdateSession } from './interfaces/session.interface';
import { SessionRepository } from './repositories/session.repository';

import { CacheService } from '../cache/cache.service';
import { CoachService } from '../coach/coach.service';
import { CoachEntity } from '../coach/entities/coach.entity';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache.enum';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class SessionService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly sessionRepository: SessionRepository,
    private readonly cacheService: CacheService,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }
  async create(user: IUser, createSessionDto: ICreateSession) {
    try {
      const session = await this.sessionRepository.createAndSaveSession(createSessionDto);

      return ResponseUtil.success(session, SessionMessages.CreatedSession);
    } catch (error) {
      return ResponseUtil.error(error?.message || SessionMessages.FailedToCreateSession, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async update(user: IUser, sessionId: number, updateSessionDto: IUpdateSession) {
    try {
      const session = await this.checkSessionOwnership(sessionId);

      const updatedSession = await this.sessionRepository.updateSession(session, updateSessionDto);

      return ResponseUtil.success({ ...updatedSession }, SessionMessages.UpdatedSession);
    } catch (error) {
      return ResponseUtil.error(error?.message || SessionMessages.FailedToUpdateSession, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getAll(user: IUser, query: { querySessionDto: ISearchSessionQuery; paginationDto: IPagination }): Promise<PageDto<SessionEntity>> {
    const { take, page } = query.paginationDto;

    const cacheKey = `${CacheKeys.CLUB_LIST}-${user.id}-${page}-${take}-${JSON.stringify(query.querySessionDto)}`;

    const cachedData = await this.cacheService.get<PageDto<SessionEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [sessions, count] = await this.sessionRepository.getSessionsWithFilters(user.id, query.querySessionDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(sessions, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 600);

    return result;
  }
  async findOneById(user: IUser, sessionId: number): Promise<ServiceResponse> {
    try {
      const session = await this.checkSessionOwnership(sessionId);

      return ResponseUtil.success(session, SessionMessages.GetSessionSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, sessionId: number): Promise<ServiceResponse> {
    try {
      const session = await this.checkSessionOwnership(sessionId);

      const removedSession = await this.sessionRepository.delete(sessionId);

      if (removedSession.affected) return ResponseUtil.success(session, SessionMessages.RemovedSessionSuccess);

      return ResponseUtil.success(removedSession, SessionMessages.RemovedSessionSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async checkSessionOwnership(sessionId: number): Promise<SessionEntity> {
    const session = await this.sessionRepository.findByIdAndOwner(sessionId);
    if (!session) throw new NotFoundException(SessionMessages.SessionNotBelongToUser);
    return session;
  }

  async validateOwnedSessions(sessionIds: number[], userId: number): Promise<SessionEntity[]> {
    const ownedSessions = await this.sessionRepository.findOwnedSessionsByIds(sessionIds);

    if (ownedSessions.length !== sessionIds.length) {
      const notOwnedSessionIds = sessionIds.filter((id) => !ownedSessions.some((session) => session.id === id));
      throw new BadRequestException(`${SessionMessages.UnauthorizedSessions} ${notOwnedSessionIds.join(', ')}`);
    }

    return ownedSessions;
  }
}
