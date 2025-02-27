import { BadRequestException, ConflictException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

import { StudentEntity } from './entities/student.entity';
import { StudentMessages } from './enums/student.message';
import { ICreateStudent, ISeachStudentQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentRepository } from './repositories/student.repository';

import { AwsService } from '../s3AWS/s3AWS.service';
import { CacheService } from '../cache/cache.service';

import { CacheKeys } from '../../common/enums/cache.enum';
import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ResponseUtil } from '../../common/utils/response';
import { ClubEntity } from '../club/entities/club.entity';
import { CoachService } from '../coach/coach.service';
import { ClubService } from '../club/club.service';
import { isGenderAllowed, isSameGender } from '../../common/utils/functions';
import { CoachEntity } from '../coach/entities/coach.entity';
import { Gender } from '../../common/enums/gender.enum';

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly studentRepository: StudentRepository,
    private readonly awsService: AwsService,
    private readonly cacheService: CacheService,
    private readonly clubService: ClubService,
    @Inject(forwardRef(() => CoachService)) private readonly coachService: CoachService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(user: IUser, createStudentDto: ICreateStudent) {
    const { clubId, coachId, national_code, gender, image } = createStudentDto;
    const userId: number = user.id;

    let studentUserId: number | null = null;
    let imageKey: string | null = null;

    try {
      if (national_code) await this.ensureUniqueNationalCode(national_code, userId);

      const { club, coach } = await this.ensureClubAndCoach(userId, clubId, coachId);
      this.validateGenderRestrictions(gender, coach, club);

      imageKey = await this.handleStudentImage(image);
      studentUserId = await this.createUserCoach();

      const student = await this.studentRepository.createStudentWithTransaction({
        ...createStudentDto,
        image_url: imageKey,
        userId: studentUserId,
      });

      return ResponseUtil.success({ ...student, studentUserId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await this.cleanupFailedCreation(studentUserId, imageKey);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(user: IUser, studentId: number, updateStudentDto: IUpdateStudent) {
    const { clubId, coachId, national_code, gender, image } = updateStudentDto;
    const userId: number = user.id;

    let imageKey: string | null = null;

    try {
      let student = national_code ? await this.ensureUniqueNationalCode(national_code, userId) : null;
      if (!student) student = await this.validateOwnership(studentId, userId);

      const { club, coach } = await this.ensureClubAndCoach(userId, clubId ?? student.clubId, coachId ?? student.coachId);
      if (gender) this.validateGenderRestrictions(gender, coach, club);

      const updateData = this.prepareUpdateData(updateStudentDto, student);
      if (image) updateData.image_url = imageKey = await this.handleStudentImage(image);

      await this.studentRepository.updateStudent(student, updateData);
      if (image && student.image_url) await this.awsService.deleteFile(student.image_url);

      return ResponseUtil.success({ ...student, ...updateData }, StudentMessages.UpdatedStudent);
    } catch (error) {
      await this.removeStudentImage(imageKey);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToUpdateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(user: IUser, query: { studentQueryDto: ISeachStudentQuery; paginationDto: IPagination }): Promise<PageDto<StudentEntity>> {
    const { take, page } = query.paginationDto;

    const cacheKey = `${CacheKeys.STUDENT_LIST}-${user.id}-${page}-${take}-${JSON.stringify(query.studentQueryDto)}`;

    const cachedData = await this.cacheService.get<PageDto<StudentEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [students, count] = await this.studentRepository.getStudentsWithFilters(user.id, query.studentQueryDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query.paginationDto);
    const result = new PageDto(students, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }

  async findOneById(user: IUser, studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.validateOwnership(studentId, user.id);

      return ResponseUtil.success(student, StudentMessages.GetStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, studentId: number): Promise<ServiceResponse> {
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const student = await this.validateOwnership(studentId, user.id);

      await this.removeUserById(Number(student?.userId));

      const removedStudent = await queryRunner.manager.delete(StudentEntity, student.id);
      await queryRunner.commitTransaction();

      if (removedStudent.affected) this.removeStudentImage(student?.image_url);

      return ResponseUtil.success(student, StudentMessages.RemovedStudentSuccess);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException(error);
    } finally {
      await queryRunner.release();
    }
  }

  private async createUserCoach(): Promise<number | null> {
    const data = { username: `STU_${Date.now()}_${Math.floor(Math.random() * 1000)}` };

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CreateUserStudent, data).pipe(timeout(this.timeout)));

    if (result?.error) throw result;
    return result?.data?.user?.id;
  }
  private async removeUserById(userId: number) {
    if (!userId) return null;

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }

  private async uploadStudentImage(image: Express.Multer.File): Promise<string | null> {
    if (!image) return null;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });
    return uploadedImage.key;
  }
  private async removeStudentImage(imageKey: string): Promise<string | null> {
    if (!imageKey) return null;

    await this.awsService.deleteFile(imageKey);
  }

  async validateOwnership(studentId: number, userId: number): Promise<StudentEntity> {
    const queryBuilder = this.studentRepository.createQueryBuilder(EntityName.Students);

    const student = await queryBuilder
      .where('students.id = :studentId', { studentId })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (!student) throw new BadRequestException(StudentMessages.StudentNotFound);

    return student;
  }
  async ensureUniqueNationalCode(nationalCode: string, userId: number): Promise<StudentEntity> {
    const queryBuilder = this.studentRepository.createQueryBuilder(EntityName.Students);

    const student = await queryBuilder
      .where('students.national_code = :nationalCode', { nationalCode })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (student) throw new BadRequestException(StudentMessages.DuplicateNationalCode);

    return student;
  }
  async hasStudentsInClub(removedClubs: ClubEntity[], coachId: number): Promise<void> {
    const clubsWithStudents: string[] = [];

    for (const club of removedClubs) {
      const hasStudents = await this.studentRepository.count({
        where: {
          club: { id: club.id },
          coach: { id: coachId },
        },
      });

      if (hasStudents > 0) clubsWithStudents.push(`${club.name}: has students`);
    }

    if (clubsWithStudents.length > 0) {
      throw new BadRequestException(`${StudentMessages.CannotRemoveClubsInArray} ${clubsWithStudents.join(', ')}`);
    }
  }

  private async ensureClubAndCoach(userId: number, clubId?: number, coachId?: number) {
    const club = clubId ? await this.clubService.checkClubOwnership(clubId, userId) : null;
    const coach = coachId ? await this.coachService.validateOwnership(coachId, userId) : null;
    return { club, coach };
  }

  private validateGenderRestrictions(gender: Gender, coach: CoachEntity | null, club: ClubEntity | null) {
    if (coach && !isSameGender(gender, coach.gender)) throw new BadRequestException(StudentMessages.CoachGenderMismatch);
    if (club && !isGenderAllowed(gender, club.genders)) throw new BadRequestException(StudentMessages.ClubGenderMismatch);
  }

  private async handleStudentImage(image?: Express.Multer.File): Promise<string | null> {
    return image ? await this.uploadStudentImage(image) : null;
  }

  private prepareUpdateData(updateDto: IUpdateStudent, student: StudentEntity): Partial<StudentEntity> {
    return Object.keys(updateDto).reduce((acc, key) => {
      if (key !== 'image' && updateDto[key] !== undefined && updateDto[key] !== student[key]) {
        acc[key] = updateDto[key];
      }
      return acc;
    }, {} as Partial<StudentEntity>);
  }

  private async cleanupFailedCreation(studentUserId: number | null, imageKey: string | null) {
    if (studentUserId) await this.removeUserById(studentUserId);
    if (imageKey) await this.removeStudentImage(imageKey);
  }
}
