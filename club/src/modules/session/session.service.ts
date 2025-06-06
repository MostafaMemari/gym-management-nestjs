import { Injectable, NotFoundException } from '@nestjs/common';

import { SessionEntity } from './entities/session.entity';
import { SessionMessages } from './enums/session.message';
import { ICreateSession, ISessionFilter, IUpdateSession } from './interfaces/session.interface';
import { SessionRepository } from './repositories/session.repository';

import { CacheService } from '../cache/cache.service';
import { GymService } from '../gym/gym.service';
import { StudentService } from '../student/student.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class SessionService {
  constructor(
    private readonly sessionRepository: SessionRepository,
    private readonly cacheService: CacheService,
    private readonly gymService: GymService,
    private readonly studentService: StudentService,
  ) {}

  async create(user: IUser, createSessionDto: ICreateSession): Promise<ServiceResponse> {
    try {
      const { gymId, coachId, studentIds } = createSessionDto;

      const gym = await this.gymService.validateOwnershipByIdWithCoaches(gymId, user.id);
      await this.gymService.validateCoachInGym(gym, coachId);
      const coach = gym.coaches.find((coach) => coach.id === coachId);

      createSessionDto.students = studentIds.length
        ? await this.studentService.validateStudentsIdsByCoachAndGender(studentIds, coach.id, coach.gender)
        : null;

      const session = await this.sessionRepository.createAndSaveSession(createSessionDto);

      await this.clearSessionCacheByUser(user.id);
      return ResponseUtil.success(
        {
          ...session,
          students: session.students.map((student) => ({
            id: student.id,
            full_name: student.full_name,
          })),
        },
        SessionMessages.CREATE_SUCCESS,
      );
    } catch (error) {
      ResponseUtil.error(error?.message || SessionMessages.CREATE_FAILURE, error?.status);
    }
  }
  async update(user: IUser, sessionId: number, updateSessionDto: IUpdateSession): Promise<ServiceResponse> {
    try {
      const { gymId, coachId, studentIds } = updateSessionDto;
      const userId = user.id;
      let gym = null;

      const session = await this.validateOwnershipById(sessionId, userId);

      if (gymId || coachId) {
        gym = await this.gymService.validateOwnershipByIdWithCoaches(gymId ?? session.gymId, userId);
        await this.gymService.validateCoachInGym(gym, coachId ?? session.coachId);
      }
      if (studentIds?.length) {
        gym = gym ? gym : await this.gymService.validateOwnershipByIdWithCoaches(gymId ?? session.gymId, userId);

        const coach = gym.coaches.find((coach) => coach.id === coachId || session.coachId);
        updateSessionDto.students = studentIds
          ? await this.studentService.validateStudentsIdsByCoachAndGender(studentIds, coach.id, coach.gender)
          : null;
      } else {
        updateSessionDto.students = [];
      }

      const updatedSession = await this.sessionRepository.updateSession(session, updateSessionDto);

      await this.clearSessionCacheByUser(userId);
      return ResponseUtil.success({ ...updatedSession }, SessionMessages.UPDATE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || SessionMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(user: IUser, query: { querySessionDto: ISessionFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [sessions, count] = await this.sessionRepository.getSessionsWithFilters(user.id, query.querySessionDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
      const result = new PageDto(sessions, pageMetaDto);

      return ResponseUtil.success(result.data, SessionMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || SessionMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, sessionId: number): Promise<ServiceResponse> {
    try {
      const session = await this.validateOwnershipById(sessionId, user.id);

      return ResponseUtil.success(session, SessionMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || SessionMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async removeById(user: IUser, sessionId: number): Promise<ServiceResponse> {
    try {
      await this.validateOwnershipById(sessionId, user.id);

      const removedSession = await this.sessionRepository.delete({ id: sessionId });

      if (!removedSession.affected) ResponseUtil.error(SessionMessages.REMOVE_FAILURE);

      return ResponseUtil.success({}, SessionMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || SessionMessages.REMOVE_FAILURE, error?.status);
    }
  }

  async validateOwnershipById(sessionId: number, userId: number): Promise<SessionEntity> {
    const session = await this.sessionRepository.findByIdAndOwner(sessionId, userId);
    if (!session) throw new NotFoundException(SessionMessages.NOT_FOUND);
    return session;
  }
  async validateOwnershipRelationStudents(sessionId: number, userId: number): Promise<SessionEntity> {
    const session = await this.sessionRepository.findByIdAndOwnerRelationStudents(sessionId, userId);
    if (!session) throw new NotFoundException(SessionMessages.NOT_FOUND);
    return session;
  }

  private async clearSessionCacheByUser(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.SESSIONS}-userId:${userId}*`);
  }
}
