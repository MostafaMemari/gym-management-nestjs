import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CoachEntity } from '../entities/coach.entity';
import { CoachMessages } from '../enums/coach.message';

@Injectable()
export class CoachRepository extends Repository<CoachEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(CoachEntity, dataSource.createEntityManager());
  }

  async createCoachWithTransaction(coachData: Partial<CoachEntity>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const coach = this.create(coachData);
      await queryRunner.manager.save(coach);
      await queryRunner.commitTransaction();
      return coach;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateCoach(coach: CoachEntity, updateData: Partial<CoachEntity>) {
    const hasRelations = ['coach', 'club'].some((rel) => updateData.hasOwnProperty(rel));

    if (hasRelations) {
      const updatedCoach = this.merge(coach, updateData);
      return await this.save(updatedCoach);
    } else {
      return await this.update(coach.id, updateData);
    }
  }

  async removeCoachWithTransaction(coachId: number): Promise<CoachEntity> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const coach = await queryRunner.manager.findOne(CoachEntity, { where: { id: coachId } });
      if (!coach) throw new NotFoundException(CoachMessages.CoachNotFound);

      await queryRunner.manager.delete(CoachEntity, { id: coachId });

      await queryRunner.commitTransaction();
      return coach;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
