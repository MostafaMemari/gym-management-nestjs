import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { EntityName } from 'src/common/enums/entity.enum';
import { ISeachStudentQuery } from '../interfaces/student.interface';

@Injectable()
export class StudentRepository extends Repository<StudentEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentEntity, dataSource.createEntityManager());
  }

  async createStudentWithTransaction(studentData: Partial<StudentEntity>) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const student = this.create(studentData);
      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();
      return student;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async updateStudent(student: StudentEntity, updateData: Partial<StudentEntity>) {
    const hasRelations = ['coach', 'club'].some((rel) => updateData.hasOwnProperty(rel));

    if (hasRelations) {
      const updatedStudent = this.merge(student, updateData);
      return await this.save(updatedStudent);
    } else {
      return await this.update(student.id, updateData);
    }
  }

  async getStudentsWithFilters(
    userId: number,
    filters: ISeachStudentQuery,
    page: number,
    take: number,
  ): Promise<[StudentEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Students)
      .leftJoin('students.coach', 'coach')
      .addSelect(['coach.id', 'coach.full_name'])
      .leftJoin('students.club', 'club')
      .addSelect(['club.id', 'club.name'])
      .where('club.ownerId = :userId', { userId });

    if (filters?.search) {
      queryBuilder.andWhere('(students.full_name LIKE :search OR students.national_code LIKE :search)', { search: `%${filters.search}%` });
    }
    if (filters?.gender) {
      queryBuilder.andWhere('students.gender = :gender', { gender: filters?.gender });
    }
    if (filters?.is_active !== undefined) {
      queryBuilder.andWhere('students.is_active = :isActive', { isActive: filters?.is_active });
    }

    if (filters?.phone_number) {
      queryBuilder.andWhere('students.phone_number LIKE :phoneNumber', { phoneNumber: `%${filters?.phone_number}%` });
    }

    if (filters?.club) {
      queryBuilder.andWhere('students.clubId = :club', { club: filters?.club });
    }

    if (filters?.coach) {
      queryBuilder.andWhere('students.coachId = :coach', { coach: filters?.coach });
    }

    if (filters?.sort_by && validSortFields.includes(filters.sort_by)) {
      queryBuilder.orderBy(`students.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('students.created_at', 'DESC');
    }

    if (filters?.sort_by) {
      queryBuilder.orderBy(`students.${filters.sort_by}`, filters.sort_order === 'asc' ? 'ASC' : 'DESC');
    } else {
      queryBuilder.orderBy('students.updated_at', 'DESC');
    }

    return queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
