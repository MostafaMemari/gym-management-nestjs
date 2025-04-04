import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';

import { SessionEntity } from '../entities/session.entity';
import { CacheKeys } from '../../../common/enums/cache';

import { EntityName } from '../../../common/enums/entity.enum';
import { ICreateSession, ISessionFilter, IUpdateSession } from '../interfaces/session.interface';
import { CacheTTLMilliseconds } from '../../../common/enums/cache';

@Injectable()
export class SessionRepository extends Repository<SessionEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(SessionEntity, dataSource.createEntityManager());
  }

  async createAndSaveSession(createSessionDto: ICreateSession): Promise<SessionEntity> {
    const session = this.create({ ...createSessionDto });
    return await this.save(session);
  }

  async updateSession(session: SessionEntity, updateSessionDto: IUpdateSession): Promise<SessionEntity> {
    const updatedSession = this.merge(session, { ...updateSessionDto });
    return await this.save(updatedSession);
  }

  async getSessionsWithFilters(userId: number, filters: ISessionFilter, page: number, take: number): Promise<[SessionEntity[], number]> {
    const cacheKey = `${CacheKeys.SESSIONS}-userId:${userId}-${page}-${take}-${JSON.stringify(filters)}`;

    const queryBuilder = this.createQueryBuilder(EntityName.SESSIONS)
      .leftJoin('sessions.club', 'club', 'club.ownerId = :userId', { userId })
      .leftJoin('sessions.students', 'students')
      .addSelect(['students.id', 'students.full_name']);

    if (filters?.search) {
      queryBuilder.andWhere('sessions.name LIKE :search', { search: `%${filters.search}%` });
    }
    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`sessions.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('sessions.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`sessions.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('sessions.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_SESSIONS)
      .getManyAndCount();
  }

  async findByIdAndOwner(sessionId: number, userId: number): Promise<SessionEntity | null> {
    return this.createQueryBuilder(EntityName.SESSIONS)
      .where('sessions.id = :sessionId', { sessionId })
      .innerJoin('sessions.club', 'club', 'club.ownerId = :userId', {
        userId,
      })
      .getOne();
  }
  async findByIdAndOwnerRelationStudents(sessionId: number, userId: number): Promise<SessionEntity | null> {
    return this.createQueryBuilder(EntityName.SESSIONS)
      .where('sessions.id = :sessionId', { sessionId })
      .innerJoin('sessions.club', 'club', 'club.ownerId = :userId', {
        userId,
      })
      .leftJoin('sessions.students', 'students')
      .addSelect(['students.id', 'students.full_name'])
      .getOne();
  }
}

const validSortFields = ['start_time', 'end_time', 'created_at', 'updated_at'];
