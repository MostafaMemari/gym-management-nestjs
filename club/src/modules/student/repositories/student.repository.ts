import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { IStudentFilter } from '../interfaces/student.interface';

import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { AgeCategoryEntity } from '../../../modules/age-category/entities/age-category.entity';
import { BeltExamEntity } from '../../../modules/belt-exam/entities/belt-exam.entity';

@Injectable()
export class StudentRepository extends Repository<StudentEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentEntity, dataSource.createEntityManager());
  }

  async createStudent(data: Partial<StudentEntity>, queryRunner?: QueryRunner): Promise<StudentEntity> {
    const student = this.create(data);

    return queryRunner ? await queryRunner.manager.save(student) : await this.save(student);
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

  async getStudentsWithFilters(userId: number, filters: IStudentFilter, page: number, take: number): Promise<[StudentEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Students)
      .innerJoin('students.club', 'club', 'club.ownerId = :userId', { userId })
      .addSelect(['club.id', 'club.name'])
      .leftJoin('students.coach', 'coach')
      .addSelect(['coach.id', 'coach.full_name'])
      .leftJoinAndSelect('students.beltInfo', 'beltInfo')
      .leftJoinAndSelect('beltInfo.belt', 'belt')
      .leftJoinAndMapMany(
        'students.age_categories',
        AgeCategoryEntity,
        'ageCategories',
        'students.birth_date BETWEEN ageCategories.start_date AND ageCategories.end_date',
      );

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
    if (filters?.club_id) {
      queryBuilder.andWhere('students.clubId = :club', { club: filters?.club_id });
    }
    if (filters?.coach_id) {
      queryBuilder.andWhere('students.coachId = :coach', { coach: filters?.coach_id });
    }

    if (filters?.belt_ids?.length) {
      queryBuilder.andWhere('beltInfo.beltId IN (:...beltIds)', { beltIds: filters.belt_ids });
    }
    if (filters?.age_category_ids?.length) {
      queryBuilder.andWhere('ageCategories.id IN (:...ageCategoryIds)', { ageCategoryIds: filters.age_category_ids });
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

    const [students, totalCount] = await queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const mappedStudents: any = (students as any).map(({ age_categories, beltInfo, ...student }) => ({
      ...student,
      belt: beltInfo
        ? {
            id: beltInfo.belt?.id,
            name: beltInfo.belt?.name,
          }
        : null,
      age_categories: age_categories?.map(({ id, name }) => ({ id, name })) || [],
    }));

    return [mappedStudents, totalCount];
  }
  async getStudentsSummaryWithFilters(
    userId: number,
    filters: IStudentFilter,
    page: number,
    take: number,
  ): Promise<[StudentEntity[], number]> {
    const queryBuilder = this.createQueryBuilder(EntityName.Students).innerJoin('students.club', 'club', 'club.ownerId = :userId', {
      userId,
    });

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
    if (filters?.club_id) {
      queryBuilder.andWhere('students.clubId = :club', { club: filters?.club_id });
    }
    if (filters?.coach_id) {
      queryBuilder.andWhere('students.coachId = :coach', { coach: filters?.coach_id });
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

    return await queryBuilder
      .addSelect(['students.id', 'students.full_name', 'students.image_url'])
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();
  }

  async findByIdAndOwner(studentId: number, userId: number): Promise<StudentEntity> {
    const student = await this.createQueryBuilder(EntityName.Students)
      .where('students.id = :studentId', { studentId })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

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

  async existsByCoachId(coachId: number): Promise<boolean> {
    const count = await this.count({ where: { coach: { id: coachId } } });
    return count > 0;
  }

  async existsByCoachIdAndCoachGender(coachId: number, gender: Gender): Promise<boolean> {
    const studentExists = await this.findOne({ where: { coachId, gender } });
    return !!studentExists;
  }

  async findStudentWithRelations(studentId: number): Promise<StudentEntity> {
    const student = await this.createQueryBuilder(EntityName.Students)
      .where('students.id = :studentId', { studentId })
      .leftJoin('students.club', 'club')
      .leftJoin('students.coach', 'coach')
      .select(['students', 'club.id', 'club.name', 'coach.id', 'coach.full_name'])
      .leftJoinAndSelect('students.beltInfo', 'beltInfo')
      .leftJoinAndSelect('beltInfo.belt', 'belt')
      .leftJoinAndSelect(
        'belt.nextBelt',
        'nextBelt',
        `
        nextBelt.min_age <= ROUND(DATEDIFF(NOW(), students.birth_date) / 365.25, 2)
        AND (nextBelt.max_age IS NULL OR nextBelt.max_age >= ROUND(DATEDIFF(NOW(), students.birth_date) / 365.25, 2))
      `,
      )
      .leftJoinAndMapMany(
        'students.beltExams',
        BeltExamEntity,
        'beltExams',
        `
          EXISTS (
            SELECT 1 
            FROM belt_exams_belts be 
            WHERE 
              be.beltExamEntityId = beltExams.id 
              AND be.beltEntityId = nextBelt.id
          ) 
          AND FIND_IN_SET(students.gender, beltExams.genders) > 0  
          AND beltExams.event_date > beltInfo.next_belt_date 
          AND beltExams.register_date > NOW()
        `,
      )
      .leftJoinAndMapMany(
        'students.age_category',
        AgeCategoryEntity,
        'ageCategories',
        'students.birth_date BETWEEN ageCategories.start_date AND ageCategories.end_date',
      )

      .getOne();

    return student;
  }

  async countStudentsByOwner(ownerId: number): Promise<number> {
    return this.createQueryBuilder(EntityName.Students)
      .leftJoin('students.club', 'club')
      .where('club.ownerId = :ownerId', { ownerId })
      .getCount();
  }

  async findByIds(ids: number[]): Promise<StudentEntity[]> {
    return this.find({ where: { id: In(ids) } });
  }

  async findByIdsAndCoachAndGender(ids: number[], coachId: number, gender: Gender): Promise<StudentEntity[]> {
    return this.find({ where: { id: In(ids), gender, coachId } });
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
