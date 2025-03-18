import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import { StudentBeltEntity } from '../entities/student-belt.entity';
import { StudentEntity } from '../entities/student.entity';

import { BeltEntity } from '../../../modules/belt/entities/belt.entity';

@Injectable()
export class StudentBeltRepository extends Repository<StudentBeltEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentBeltEntity, dataSource.createEntityManager());
  }

  async createStudentBelt(
    student: StudentEntity,
    belt: BeltEntity,
    belt_date: Date,
    next_belt_date?: Date,
    queryRunner?: QueryRunner,
  ): Promise<StudentBeltEntity> {
    const studentBelt = this.create({
      student,
      belt,
      belt_date,
      next_belt_date,
    });

    try {
      if (queryRunner) {
        return await queryRunner.manager.save(studentBelt);
      }
      return await this.save(studentBelt);
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException('Failed to create student belt');
    }
  }
}
