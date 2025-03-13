import { Injectable } from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';

import { SessionEntity } from '../entities/session.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { ICreateSession, ISearchSessionQuery, IUpdateSession } from '../interfaces/session.interface';

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

  async getSessionsWithFilters(
    userId: number,
    filters: ISearchSessionQuery,
    page: number,
    take: number,
  ): Promise<[SessionEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Sessions).where('sessions.ownerId = :ownerId', { ownerId: userId });

    if (filters?.search) {
      queryBuilder.andWhere('sessions.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters?.sort_order) {
      queryBuilder.orderBy('sessions.updated_at', filters.sort_order === 'asc' ? 'ASC' : 'DESC');
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
