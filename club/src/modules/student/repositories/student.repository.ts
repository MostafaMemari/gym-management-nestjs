import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { StudentEntity } from '../entities/student.entity';
import { EntityName } from '../../../common/enums/entity.enum';
import { ISeachStudentQuery } from '../interfaces/student.interface';
import { StudentMessages } from '../enums/student.message';

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

  async removeStudentById(studentId: number): Promise<boolean> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const removedStudent = await queryRunner.manager.delete(StudentEntity, studentId);
      await queryRunner.commitTransaction();

      return removedStudent.affected > 0;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
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

  async findStudentByOwner(studentId: number, userId: number): Promise<StudentEntity> {
    const student = await this.createQueryBuilder(EntityName.Students)
      .where('students.id = :studentId', { studentId })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (!student) {
      throw new BadRequestException(StudentMessages.StudentNotFound);
    }

    return student;
  }

  async findStudentByNationalCode(nationalCode: string, userId: number): Promise<StudentEntity> {
    const student = await this.createQueryBuilder(EntityName.Students)
      .where('students.national_code = :nationalCode', { nationalCode })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    return student;
  }

  async existsStudentsInClub(clubId: number, coachId: number): Promise<boolean> {
    const count = await this.count({ where: { club: { id: clubId }, coach: { id: coachId } } });

    return count > 0;
  }

  async existsStudentsByCoachId(coachId: number): Promise<boolean> {
    const count = await this.count({ where: { coach: { id: coachId } } });
    return count > 0;
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
