import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { DataSource } from 'typeorm';

import { StudentEntity } from './entities/student.entity';
import { CacheKeys } from './enums/cache.enum';
import { StudentMessages } from './enums/student.message';
import { IStudentBulkCreateDto, IStudentCreateDto, IStudentFilter, IStudentUpdateDto } from './interfaces/student.interface';
import { StudentBeltRepository } from './repositories/student-belt.repository';
import { StudentRepository } from './repositories/student.repository';

import { BeltService } from '../belt/belt.service';
import { CacheService } from '../cache/cache.service';
import { GymService } from '../gym/gym.service';
import { GymEntity } from '../gym/entities/gym.entity';
import { CoachService } from '../coach/coach.service';
import { CoachEntity } from '../coach/entities/coach.entity';
import { AwsService } from '../s3AWS/s3AWS.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { shmasiToMiladi } from '../../common/utils/date/convertDate';
import { isGenderAllowed, isSameGender } from '../../common/utils/functions';
import { ResponseUtil } from '../../common/utils/response';

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly studentRepository: StudentRepository,
    private readonly studentBeltRepository: StudentBeltRepository,
    private readonly awsService: AwsService,
    private readonly cacheService: CacheService,
    private readonly gymService: GymService,
    private readonly beltService: BeltService,
    private readonly dataSource: DataSource,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async create(user: IUser, createStudentDto: IStudentCreateDto): Promise<ServiceResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { gym_id, coach_id, belt_id, belt_date, national_code, gender, image } = createStudentDto;
    const userId: number = user.id;

    let imageKey: string | null = null;
    let studentUserId: number | null = null;

    try {
      if (national_code) await this.validateUniqueNationalCode(national_code, userId);
      const { gym, coach } = await this.validateOwnershipGymAndCoach(userId, gym_id, coach_id);
      this.validateGymIdInCoach(gym_id, coach);
      this.validateStudentGender(gender, coach, gym);

      imageKey = image ? await this.updateImage(image) : null;
      studentUserId = await this.createUserStudent();

      const student = await this.studentRepository.createStudent(
        { ...createStudentDto, image_url: imageKey, userId: studentUserId },
        userId,
        queryRunner,
      );

      if (belt_id && belt_date) {
        const belt = await this.beltService.validateByIdWithRelation(belt_id);
        const nextBeltDate = this.beltService.calculateNextBeltDate(belt_date, belt.duration_month);
        await this.studentBeltRepository.createStudentBelt(student, belt, belt_date, nextBeltDate, queryRunner);
      }

      await queryRunner.commitTransaction();
      await this.clearStudentCacheByUser(userId);
      return ResponseUtil.success({ ...student, userId: studentUserId }, StudentMessages.CREATE_SUCCESS);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeStudentData(studentUserId, imageKey);
      ResponseUtil.error(error?.message || StudentMessages.CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }
  async update(user: IUser, studentId: number, updateStudentDto: IStudentUpdateDto): Promise<ServiceResponse> {
    const { gym_id, coach_id, belt_id, national_code, gender, image } = updateStudentDto;
    const userId: number = user.id;

    let imageKey: string | null = null;

    try {
      let student = national_code ? await this.validateUniqueNationalCode(national_code, userId) : null;
      if (!student) student = await this.validateOwnershipById(studentId, userId);

      if (belt_id) await this.beltService.validateById(belt_id);

      if (gym_id || coach_id || gender) {
        const { gym, coach } = await this.validateOwnershipGymAndCoach(userId, gym_id ?? student.gym_id, coach_id ?? student.coach_id);
        this.validateGymIdInCoach(gym.id, coach);
        this.validateStudentGender(gender ?? student.gender, coach, gym);
      }

      const updateData = this.prepareUpdateData(updateStudentDto, student);
      if (gym_id !== undefined) updateData.gym_id = gym_id;
      if (coach_id !== undefined) updateData.coach_id = coach_id;

      if (image) updateData.image_url = await this.updateImage(image);

      const studentUpdated = await this.studentRepository.updateStudent(student, updateData, userId);

      if (image && updateData.image_url && student.image_url) {
        await this.awsService.deleteFile(student.image_url);
      }

      await this.clearStudentCacheByUser(userId);
      return ResponseUtil.success(studentUpdated, StudentMessages.UPDATE_SUCCESS);
    } catch (error) {
      await this.removeImage(imageKey);
      ResponseUtil.error(error?.message || StudentMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getAll(user: IUser, query: { queryStudentDto: IStudentFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [students, count] = await this.studentRepository.getStudentsWithFilters(user.id, query.queryStudentDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query.paginationDto);
      const result = new PageDto(students, pageMetaDto);

      return ResponseUtil.success(result.data, StudentMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async getAllSummary(user: IUser, query: { queryStudentDto: IStudentFilter; paginationDto: IPagination }): Promise<ServiceResponse> {
    const { take, page } = query.paginationDto;

    try {
      const [students, count] = await this.studentRepository.getStudentsSummaryWithFilters(user.id, query.queryStudentDto, page, take);

      const pageMetaDto = new PageMetaDto(count, query.paginationDto);
      const result = new PageDto(students, pageMetaDto);

      return ResponseUtil.success(result.data, StudentMessages.GET_ALL_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async findOneById(user: IUser, studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.validateOwnershipById(studentId, user.id);

      return ResponseUtil.success(student, StudentMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.GET_ALL_FAILURE, error?.status);
    }
  }
  async getOneDetails(studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.studentRepository.findStudentWithRelations(studentId);

      return ResponseUtil.success(student, StudentMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.GET_FAILURE, error?.status);
    }
  }
  async removeById(user: IUser, studentId: number): Promise<ServiceResponse> {
    try {
      const userId = user.id;
      const student = await this.validateOwnershipById(studentId, userId);

      const studentRemoved = await this.studentRepository.removeStudent(student, userId);

      this.removeStudentData(Number(student.userId), student.image_url);

      await this.clearStudentCacheByUser(userId);
      return ResponseUtil.success(studentRemoved, StudentMessages.REMOVE_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.REMOVE_FAILURE, error?.status);
    }
  }
  async bulkCreate(user: IUser, studentData: IStudentBulkCreateDto, studentsJson: Express.Multer.File): Promise<ServiceResponse> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { gym_id, coach_id, gender } = studentData;
    const userId: number = user.id;
    const studentUserIds = [];

    try {
      const belts = await this.beltService.getNamesAndIds();

      const { gym, coach } = await this.validateOwnershipGymAndCoach(userId, gym_id, coach_id);
      this.validateGymIdInCoach(gym_id, coach);
      this.validateStudentGender(gender, coach, gym);

      const students: any = JSON.parse(Buffer.from(studentsJson.buffer).toString('utf-8'));

      for (const student of students) {
        const fullName = student.full_name.replace(/ي/g, 'ی');
        const nationalCode = `${student.national_code}`.padStart(10, '0');
        const birthDate = shmasiToMiladi(student.birth_date as any);
        const membershipYear = student.membership_year;

        const userStudentId = await this.createUserStudent();
        if (userStudentId) studentUserIds.push(userStudentId);

        const belt_id = belts.find((belt) => belt.name === student.belt)?.id;
        const beltDate = shmasiToMiladi(student.belt_date as any);

        await this.validateUniqueNationalCode(student.national_code, userId);

        const studentCreate = await this.studentRepository.createStudent(
          {
            full_name: fullName,
            national_code: nationalCode,
            birth_date: birthDate,
            membership_year: membershipYear,
            gender,
            coach_id,
            gym_id,
            userId: userStudentId,
          },
          userId,
          queryRunner,
        );

        if (belt_id && beltDate) {
          const belt = await this.beltService.validateByIdWithRelation(belt_id);
          const nextBeltDate = this.beltService.calculateNextBeltDate(beltDate, belt.duration_month);
          await this.studentBeltRepository.createStudentBelt(studentCreate, belt, beltDate, nextBeltDate, queryRunner);
        }
      }
      await queryRunner.commitTransaction();

      await this.clearStudentCacheByUser(userId);
      return ResponseUtil.success(
        { count: studentUserIds.length + 1 },
        StudentMessages.BULK_CREATE_SUCCESS.replace('{count}', (studentUserIds.length + 1).toString()),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeStudentsUserByIds(studentUserIds);
      ResponseUtil.error(error?.message || StudentMessages.BULK_CREATE_FAILURE, error?.status);
    } finally {
      await queryRunner.release();
    }
  }
  async getOneByNationalCode(nationalCode: string): Promise<ServiceResponse> {
    try {
      const student = await this.studentRepository.findOneBy({ national_code: nationalCode });
      if (!student) throw new NotFoundException(StudentMessages.NOT_FOUND);
      return ResponseUtil.success(student, StudentMessages.GET_SUCCESS);
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.UPDATE_FAILURE, error?.status);
    }
  }
  async getCountStudentsByOwner(ownerId: number): Promise<ServiceResponse> {
    try {
      const count = await this.studentRepository.countStudentsByOwner(ownerId);

      return ResponseUtil.success({ count }, StudentMessages.GET_COUNT_SUCCESS.replace('{count}', count.toString()));
    } catch (error) {
      ResponseUtil.error(error?.message || StudentMessages.GET_COUNT_FAILURE, error?.status);
    }
  }

  private async createUserStudent(): Promise<number> {
    const username = `STU_${Math.random().toString(36).slice(2, 8)}`;

    await checkConnection(Services.USER, this.userServiceClientProxy, { pattern: UserPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.CREATE_STUDENT, { username }).pipe(timeout(this.timeout)),
    );

    if (result?.error) throw result;
    return result?.data?.user?.id ?? null;
  }
  private async removeStudentUserById(userId: number): Promise<void> {
    if (!userId) return null;

    await checkConnection(Services.USER, this.userServiceClientProxy, { pattern: UserPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.REMOVE_ONE, { userId }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }
  private async removeStudentsUserByIds(userIds: number[]): Promise<void> {
    if (!userIds.length) return null;

    await checkConnection(Services.USER, this.userServiceClientProxy, { pattern: UserPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.REMOVE_MANY, { userIds }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }
  private async updateImage(image: Express.Multer.File): Promise<string | undefined> {
    if (!image) return;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });
    return uploadedImage.key;
  }
  private async removeImage(imageKey: string): Promise<void> {
    if (!imageKey) return;
    await this.awsService.deleteFile(imageKey);
  }
  private async validateUniqueNationalCode(nationalCode: string, userId: number): Promise<StudentEntity> {
    const student = await this.studentRepository.findStudentByNationalCode(nationalCode, userId);
    if (student) throw new BadRequestException(StudentMessages.DUPLICATE_ENTRY);
    return student;
  }
  private async removeStudentData(studentUserId: number, imageKey: string | null): Promise<void> {
    await Promise.all([
      studentUserId ? this.removeStudentUserById(studentUserId) : Promise.resolve(),
      imageKey ? this.removeImage(imageKey) : Promise.resolve(),
    ]);
  }

  private async validateOwnershipById(studentId: number, userId: number): Promise<StudentEntity> {
    const student = await this.studentRepository.findByIdAndOwner(studentId, userId);
    if (!student) throw new NotFoundException(StudentMessages.NOT_FOUND);
    return student;
  }
  private async validateOwnershipGymAndCoach(userId: number, gym_id?: number, coach_id?: number) {
    const gym = gym_id ? await this.gymService.validateOwnershipById(gym_id, userId) : null;
    const coach = coach_id ? await this.coachService.validateOwnershipById(coach_id, userId) : null;
    return { gym, coach };
  }
  private validateStudentGender(gender: Gender, coach?: CoachEntity, gym?: GymEntity) {
    if (coach && !isSameGender(gender, coach.gender)) throw new BadRequestException(StudentMessages.COACH_GENDER_MISMATCH);
    if (gym && !isGenderAllowed(gender, gym.genders)) throw new BadRequestException(StudentMessages.CLUB_GENDER_MISMATCH);
  }
  private validateGymIdInCoach(gym_id: number, coach: CoachEntity): void {
    const exists = coach.gyms.some((gym) => gym.id === gym_id);
    if (!exists) {
      throw new BadRequestException(
        StudentMessages.COACH_NOT_IN_CLUB.replace('{coach_id}', coach.id.toString()).replace('{gym_id}', gym_id.toString()),
      );
    }
  }
  async validateRemovedGymsStudents(gyms: GymEntity[], coach_id: number): Promise<void> {
    const gymsWithStudents: string[] = [];

    for (const gym of gyms) {
      const hasStudents = await this.studentRepository.existsStudentsInGym(gym.id, coach_id);
      if (hasStudents) gymsWithStudents.push(`${gym.id}`);
    }

    if (gymsWithStudents.length > 0) {
      throw new BadRequestException(StudentMessages.MULTIPLE_NOT_FOUND.replace('{ids}', gymsWithStudents.join(', ')));
    }
  }
  async validateStudentsIdsByCoachAndGender(studentIds: number[], coach_id: number, gender: Gender): Promise<StudentEntity[]> {
    const foundStudents = await this.studentRepository.findByIdsAndCoachAndGender(studentIds, coach_id, gender);
    const foundIds = foundStudents.map((student) => student.id);
    const invalidIds = studentIds.filter((id) => !foundIds.includes(id));

    if (invalidIds.length > 0) {
      throw new NotFoundException(StudentMessages.MULTIPLE_NOT_FOUND.replace('{ids}', invalidIds.join(', ')));
    }

    return foundStudents;
  }
  async validateStudentsIdsByCoach(studentIds: number[], coach_id: number): Promise<StudentEntity[]> {
    const foundStudents = await this.studentRepository.findByIdsAndCoach(studentIds, coach_id);
    const foundIds = foundStudents.map((student) => student.id);
    const invalidIds = studentIds.filter((id) => !foundIds.includes(id));

    if (invalidIds.length > 0) {
      throw new NotFoundException(StudentMessages.MULTIPLE_NOT_FOUND.replace('{ids}', invalidIds.join(', ')));
    }

    return foundStudents;
  }

  async validateGenderCoachStudent(coach_id: number, gender: Gender): Promise<boolean> {
    return await this.studentRepository.existsByCoachIdAndCoachGender(coach_id, gender);
  }
  async hasStudentsAssignedToCoach(coach_id: number): Promise<boolean> {
    return await this.studentRepository.existsByCoachId(coach_id);
  }

  private prepareUpdateData(updateDto: IStudentUpdateDto, student: StudentEntity): Partial<StudentEntity> {
    return Object.keys(updateDto).reduce((acc, key) => {
      if (key !== 'image' && updateDto[key] !== undefined && updateDto[key] !== student[key]) {
        acc[key] = updateDto[key];
      }
      return acc;
    }, {} as Partial<StudentEntity>);
  }

  private async clearStudentCacheByUser(userId: number) {
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS}-userId:${userId}*`);
    await this.cacheService.delByPattern(`${CacheKeys.STUDENTS_SUMMARY}-userId:${userId}*`);
  }
}
