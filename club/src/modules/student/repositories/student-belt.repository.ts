import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';

import { StudentBeltEntity } from '../entities/student-belt.entity';
import { BeltEntity } from 'src/modules/belt/entities/belt.entity';

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
    console.log(queryRunner);

    // return await this.save(studentBelt);

    return queryRunner ? await queryRunner.manager.save(studentBelt) : await this.save(studentBelt);
  }
}
