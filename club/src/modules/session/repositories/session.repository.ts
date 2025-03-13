import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { SessionEntity } from '../entities/session.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { ICreateSession, ISessionFilter, IUpdateSession } from '../interfaces/session.interface';

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
    const queryBuilder = this.createQueryBuilder(EntityName.Sessions).innerJoin('sessions.club', 'club', 'club.ownerId = :userId', {
      userId,
    });

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
      .getManyAndCount();
  }

  async findByIdAndOwner(sessionId: number): Promise<SessionEntity | null> {
    return this.findOne({ where: { id: sessionId } });
  }

  async findOwnedSessionsByIds(sessionIds: number[]): Promise<SessionEntity[]> {
    return this.find({
      where: { id: In(sessionIds) },
    });
  }
}

const validSortFields = ['start_time', 'end_time', 'created_at', 'updated_at'];
