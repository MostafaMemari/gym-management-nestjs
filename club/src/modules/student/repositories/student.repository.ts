import { Injectable } from '@nestjs/common';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';

import { StudentEntity } from '../entities/student.entity';
import { CacheKeys } from '../../../common/enums/cache';
import { IStudentFilter } from '../interfaces/student.interface';

import { CacheTTLMilliseconds } from '../../../common/enums/cache';
import { EntityName } from '../../../common/enums/entity.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { AgeCategoryEntity } from '../../../modules/age-category/entities/age-category.entity';
import { BeltExamEntity } from '../../../modules/belt-exam/entities/belt-exam.entity';

@Injectable()
export class StudentRepository extends Repository<StudentEntity> {
  constructor(private readonly dataSource: DataSource) {
    super(StudentEntity, dataSource.createEntityManager());
  }

  async createAndSave(data: Partial<StudentEntity>, queryRunner?: QueryRunner): Promise<StudentEntity> {
    const student = this.create(data);
    return queryRunner ? await queryRunner.manager.save(student) : await this.save(student);
  }
  async updateMergeAndSave(student: StudentEntity, updateData: Partial<StudentEntity>) {
    const updatedStudent = this.merge(student, updateData);
    return await this.save(updatedStudent);
  }
  async removeStudent(student: StudentEntity): Promise<StudentEntity> {
    return await this.remove(student);
  }

  async getStudentsWithFilters(ownerId: number, filters: IStudentFilter, page: number, take: number): Promise<[StudentEntity[], number]> {
    const cacheKey = `${CacheKeys.STUDENTS}-${page}-${take}-${JSON.stringify(filters)}`.replace(':userId', ownerId.toString());

    const queryBuilder = this.createQueryBuilder(EntityName.STUDENTS)
      .where('students.owner_id = :ownerId', { ownerId })
      .leftJoin('students.gym', 'gym')
      .addSelect(['gym.id', 'gym.name'])
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
    if (filters?.gym_id) {
      queryBuilder.andWhere('students.gym_id = :gym', { gym: filters?.gym_id });
    }
    if (filters?.coach_id) {
      queryBuilder.andWhere('students.coach_id = :coach', { coach: filters?.coach_id });
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
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_STUDENTS)
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
    ownerId: number,
    filters: IStudentFilter,
    page: number,
    take: number,
  ): Promise<[StudentEntity[], number]> {
    const cacheKey = `${CacheKeys.STUDENTS_SUMMARY}-${page}-${take}-${JSON.stringify(filters)}`.replace('{ownerId}', ownerId.toString());

    const queryBuilder = this.createQueryBuilder(EntityName.STUDENTS).where('students.owner_id = :ownerId', { ownerId });

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
    if (filters?.gym_id) {
      queryBuilder.andWhere('students.gym_id = :gym', { gym: filters?.gym_id });
    }
    if (filters?.coach_id) {
      queryBuilder.andWhere('students.coach_id = :coach', { coach: filters?.coach_id });
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
      .skip((page - 1) * take)
      .take(take)
      .cache(cacheKey, CacheTTLMilliseconds.GET_ALL_STUDENTS_SUMMARY)
      .getManyAndCount();
  }

  async findByIdAndAdmin(studentId: number, adminId: number): Promise<StudentEntity> {
    return this.createQueryBuilder(EntityName.STUDENTS)
      .where('students.id = :studentId', { studentId })
      .innerJoin('students.gym', 'gym')
      .andWhere('gym.admin_id = :adminId', { adminId })
      .getOne();
  }
  async findByIdAndCoachUserId(studentId: number, coachUserId: number): Promise<StudentEntity> {
    return this.createQueryBuilder(EntityName.STUDENTS)
      .where('students.id = :studentId', { studentId })
      .innerJoin('students.coach', 'coach')
      .andWhere('coach.user_id = :coachUserId', { coachUserId })
      .getOne();
  }

  async findByIdAndCoach(studentId: number, coachId: number): Promise<StudentEntity> {
    return this.createQueryBuilder(EntityName.STUDENTS)
      .where('students.id = :studentId', { studentId })
      .andWhere('students.coach_id = :coachId', { coachId })
      .getOne();
  }

  async findStudentByNationalCode(nationalCode: string): Promise<StudentEntity> {
    return await this.findOneBy({ national_code: nationalCode });
  }

  async existsStudentsInGym(gym_id: number, coach_id: number): Promise<boolean> {
    const count = await this.count({ where: { gym: { id: gym_id }, coach: { id: coach_id } } });

    return count > 0;
  }

  async existsByCoachId(coach_id: number): Promise<boolean> {
    const count = await this.count({ where: { coach: { id: coach_id } } });
    return count > 0;
  }

  async existsByCoachIdAndCoachGender(coach_id: number, gender: Gender): Promise<boolean> {
    const studentExists = await this.findOne({ where: { coach_id, gender } });
    return !!studentExists;
  }

  async findStudentWithRelations(studentId: number): Promise<StudentEntity> {
    const student = await this.createQueryBuilder(EntityName.STUDENTS)
      .where('students.id = :studentId', { studentId })
      .leftJoin('students.gym', 'gym')
      .leftJoin('students.coach', 'coach')
      .select(['students', 'gym.id', 'gym.name', 'coach.id', 'coach.full_name'])
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

  async countStudentsByOwner(owner_id: number): Promise<number> {
    return this.createQueryBuilder(EntityName.STUDENTS)
      .leftJoin('students.gym', 'gym')
      .where('gym.owner_id = :owner_id', { owner_id })
      .getCount();
  }

  async findByIds(ids: number[]): Promise<StudentEntity[]> {
    return this.find({ where: { id: In(ids) } });
  }

  async findByIdsAndCoachAndGender(ids: number[], coach_id: number, gender: Gender): Promise<StudentEntity[]> {
    return this.find({ where: { id: In(ids), gender, coach_id } });
  }
  async findByIdsAndCoach(ids: number[], coach_id: number): Promise<StudentEntity[]> {
    return this.find({ where: { id: In(ids), coach_id } });
  }
}

const validSortFields = ['birth_date', 'sports_insurance_date', 'expire_image_date', 'created_at', 'updated_at'];
