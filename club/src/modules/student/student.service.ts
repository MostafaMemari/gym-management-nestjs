import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { DataSource } from 'typeorm';

import { StudentEntity } from './entities/student.entity';
import { StudentMessages } from './enums/student.message';
import { IBulkCreateStudent, ICreateStudent, ISeachStudentQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentBeltRepository } from './repositories/student-belt.repository';
import { StudentRepository } from './repositories/student.repository';

import { BeltService } from '../belt/belt.service';
import { CacheService } from '../cache/cache.service';
import { ClubService } from '../club/club.service';
import { ClubEntity } from '../club/entities/club.entity';
import { CoachService } from '../coach/coach.service';
import { CoachEntity } from '../coach/entities/coach.entity';
import { AwsService } from '../s3AWS/s3AWS.service';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { CacheKeys } from '../../common/enums/cache.enum';
import { Gender } from '../../common/enums/gender.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { IPagination } from '../../common/interfaces/pagination.interface';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { addMonthsToDateShamsi } from '../../common/utils/date/addMonths';
import { mildadiToShamsi, shmasiToMiladi } from '../../common/utils/date/convertDate';
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
    private readonly clubService: ClubService,
    private readonly beltService: BeltService,
    private readonly dataSource: DataSource,
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
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { clubId, coachId, beltId, belt_date, national_code, gender, image } = createStudentDto;
    const userId: number = user.id;

    let imageKey: string | null = null;
    let studentUserId: number | null = null;

    try {
      if (national_code) await this.validateUniqueNationalCode(national_code, userId);
      const { club, coach } = await this.validateClubAndCoachOwnership(userId, clubId, coachId);
      this.checkClubIdInCoachClubs(clubId, coach);
      this.validateStudentGender(gender, coach, club);

      imageKey = image ? await this.uploadStudentImage(image) : null;
      studentUserId = await this.createUserStudent();

      const student = await this.studentRepository.createStudent(
        {
          ...createStudentDto,
          image_url: imageKey,
          userId: studentUserId,
        },
        queryRunner,
      );

      if (beltId && belt_date) {
        const belt = await this.beltService.findBeltWithRelationsOrThrow(beltId);
        const nextBeltDate = this.calculateNextBeltDate(belt_date, belt.duration_month);
        await this.studentBeltRepository.createStudentBelt(student, belt, belt_date, nextBeltDate, queryRunner);
      }

      await queryRunner.commitTransaction();
      return ResponseUtil.success({ ...student, userId: studentUserId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeStudentData(studentUserId, imageKey);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }

  async update(user: IUser, studentId: number, updateStudentDto: IUpdateStudent) {
    const { clubId, coachId, beltId, national_code, gender, image } = updateStudentDto;
    const userId: number = user.id;

    let imageKey: string | null = null;

    try {
      let student = national_code ? await this.validateUniqueNationalCode(national_code, userId) : null;
      if (!student) student = await this.checkStudentOwnership(studentId, userId);

      if (beltId) await this.beltService.findBeltByIdOrThrow(beltId);

      if (clubId || coachId || gender) {
        const { club, coach } = await this.validateClubAndCoachOwnership(userId, clubId ?? student.clubId, coachId ?? student.coachId);
        this.checkClubIdInCoachClubs(club.id, coach);
        this.validateStudentGender(gender ?? student.gender, coach, club);
      }

      const updateData = this.prepareUpdateData(updateStudentDto, student);
      if (clubId !== undefined) updateData.clubId = clubId;
      if (coachId !== undefined) updateData.coachId = coachId;

      if (image) updateData.image_url = await this.uploadStudentImage(image);

      await this.studentRepository.updateStudent(student, updateData);

      if (image && updateData.image_url && student.image_url) {
        await this.awsService.deleteFile(student.image_url);
      }

      return ResponseUtil.success({ ...student, ...updateData }, StudentMessages.UpdatedStudent);
    } catch (error) {
      await this.removeStudentImage(imageKey);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToUpdateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  async getAll(user: IUser, query: { queryStudentDto: ISeachStudentQuery; paginationDto: IPagination }): Promise<PageDto<StudentEntity>> {
    const { take, page } = query.paginationDto;

    const cacheKey = `${CacheKeys.STUDENT_LIST}:${user.id}-${page}-${take}-${JSON.stringify(query.queryStudentDto)}`;

    const cachedData = await this.cacheService.get<PageDto<StudentEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const [students, count] = await this.studentRepository.getStudentsWithFilters(user.id, query.queryStudentDto, page, take);

    const pageMetaDto = new PageMetaDto(count, query.paginationDto);
    const result = new PageDto(students, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 60);

    return result;
  }
  async findOneById(user: IUser, studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.checkStudentOwnership(studentId, user.id);

      return ResponseUtil.success(student, StudentMessages.GetStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async getStudentDetails(studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.studentRepository.findStudentWithRelations(studentId);

      return ResponseUtil.success(student, StudentMessages.GetStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async removeById(user: IUser, studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.checkStudentOwnership(studentId, user.id);

      const isRemoved = await this.studentRepository.removeStudentById(studentId);

      if (isRemoved) this.removeStudentData(Number(student.userId), student.image_url);

      return ResponseUtil.success(student, StudentMessages.RemovedStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async bulkCreate(user: IUser, studentData: IBulkCreateStudent, studentsJson: Express.Multer.File) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const { clubId, coachId, gender } = studentData;
    const userId: number = user.id;
    const studentUserIds = [];

    try {
      const belts = await this.beltService.getNamesAndIds();

      const { club, coach } = await this.validateClubAndCoachOwnership(userId, clubId, coachId);
      this.checkClubIdInCoachClubs(clubId, coach);
      this.validateStudentGender(gender, coach, club);

      const students: any = JSON.parse(Buffer.from(studentsJson.buffer).toString('utf-8'));

      for (const student of students) {
        const fullName = student.full_name.replace(/ي/g, 'ی');
        const nationalCode = `${student.national_code}`.padStart(10, '0');
        const birthDate = shmasiToMiladi(student.birth_date as any);
        const membershipYear = student.membership_year;

        const userStudentId = await this.createUserStudent();
        if (userStudentId) studentUserIds.push(userStudentId);

        const beltId = belts.find((belt) => belt.name === student.belt)?.id;
        const betlDate = shmasiToMiladi(student.belt_date as any);

        await this.validateUniqueNationalCode(student.national_code, userId);

        const studentCreate = await this.studentRepository.createStudent(
          {
            full_name: fullName,
            national_code: nationalCode,
            birth_date: birthDate,
            membership_year: membershipYear,
            gender,
            coachId,
            clubId,
            userId: userStudentId,
          },
          queryRunner,
        );

        if (beltId && betlDate) {
          const belt = await this.beltService.findBeltWithRelationsOrThrow(beltId);
          const nextBeltDate = this.calculateNextBeltDate(betlDate, belt.duration_month);
          await this.studentBeltRepository.createStudentBelt(studentCreate, belt, betlDate, nextBeltDate, queryRunner);
        }
      }
      await queryRunner.commitTransaction();
      return ResponseUtil.success({ count: studentUserIds.length + 1 }, StudentMessages.CreatedStudent);
    } catch (error) {
      console.log(studentUserIds);
      await queryRunner.rollbackTransaction();
      await this.removeStudentsUserByIds(studentUserIds);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
  async getOneByNationalCode(nationalCode: string): Promise<ServiceResponse> {
    try {
      const student = await this.studentRepository.findOneBy({ national_code: nationalCode });
      if (!student) throw new NotFoundException(StudentMessages.StudentNotFound);
      return ResponseUtil.success(student, StudentMessages.GetStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async getCountStudentsByOwner(ownerId: number) {
    try {
      const count = await this.studentRepository.countStudentsByOwner(ownerId);

      return ResponseUtil.success({ count }, StudentMessages.GetCountStudentSuccessfully);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async checkStudentOwnership(studentId: number, userId: number): Promise<StudentEntity> {
    const student = await this.studentRepository.findByIdAndOwner(studentId, userId);
    if (!student) throw new NotFoundException(StudentMessages.StudentNotFound);
    return student;
  }

  private async createUserStudent(): Promise<number | null> {
    const username = `STU_${Math.random().toString(36).slice(2, 8)}`;

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.CreateUserStudent, { username }).pipe(timeout(this.timeout)),
    );

    if (result?.error) throw result;
    return result?.data?.user?.id ?? null;
  }
  private async removeStudentUserById(userId: number): Promise<void> {
    if (!userId) return null;

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }
  private async removeStudentsUserByIds(userIds: number[]): Promise<void> {
    if (!userIds.length) return null;

    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUsers, { userIds }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }
  private async uploadStudentImage(image: Express.Multer.File): Promise<string | undefined> {
    if (!image) return;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });
    return uploadedImage.key;
  }
  private async removeStudentImage(imageKey: string): Promise<void> {
    if (!imageKey) return;
    await this.awsService.deleteFile(imageKey);
  }
  private async validateUniqueNationalCode(nationalCode: string, userId: number): Promise<StudentEntity> {
    const student = await this.studentRepository.findStudentByNationalCode(nationalCode, userId);
    if (student) throw new BadRequestException(StudentMessages.DuplicateNationalCode);
    return student;
  }

  private async validateClubAndCoachOwnership(userId: number, clubId?: number, coachId?: number) {
    const club = clubId ? await this.clubService.checkClubOwnership(clubId, userId) : null;
    const coach = coachId ? await this.coachService.checkCoachOwnership(coachId, userId) : null;
    return { club, coach };
  }

  private validateStudentGender(gender: Gender, coach: CoachEntity | null, club: ClubEntity | null) {
    if (coach && !isSameGender(gender, coach.gender)) throw new BadRequestException(StudentMessages.CoachGenderMismatch);
    if (club && !isGenderAllowed(gender, club.genders)) throw new BadRequestException(StudentMessages.ClubGenderMismatch);
  }

  private prepareUpdateData(updateDto: IUpdateStudent, student: StudentEntity): Partial<StudentEntity> {
    return Object.keys(updateDto).reduce((acc, key) => {
      if (key !== 'image' && updateDto[key] !== undefined && updateDto[key] !== student[key]) {
        acc[key] = updateDto[key];
      }
      return acc;
    }, {} as Partial<StudentEntity>);
  }

  private async removeStudentData(studentUserId: number, imageKey: string | null) {
    await Promise.all([
      studentUserId ? this.removeStudentUserById(studentUserId) : Promise.resolve(),
      imageKey ? this.removeStudentImage(imageKey) : Promise.resolve(),
    ]);
  }

  private checkClubIdInCoachClubs(clubId: number, coach: CoachEntity): void {
    const exists = coach.clubs.some((club) => club.id === clubId);
    if (!exists) throw new BadRequestException(`Coach (ID: ${coach.id}) is not associated with Club (ID: ${clubId})`);
  }

  async hasStudentsAssignedToCoach(coachId: number): Promise<boolean> {
    return await this.studentRepository.existsByCoachId(coachId);
  }
  async checkStudentsInRemovedClubs(removedClubs: ClubEntity[], coachId: number): Promise<void> {
    const clubsWithStudents: string[] = [];

    for (const club of removedClubs) {
      const hasStudents = await this.studentRepository.existsStudentsInClub(club.id, coachId);
      if (hasStudents) clubsWithStudents.push(`${club.id}`);
    }

    if (clubsWithStudents.length > 0) {
      throw new BadRequestException(`${StudentMessages.CannotRemoveClubsInArray} ${clubsWithStudents.join(', ')}`);
    }
  }
  async hasStudentsByGender(coachId: number, gender: Gender): Promise<boolean> {
    return await this.studentRepository.existsByCoachIdAndCoachGender(coachId, gender);
  }

  calculateNextBeltDate(beltDate: Date, durationMonths: number): Date {
    const shamsiBeltDate = mildadiToShamsi(beltDate);
    const nextBeltDateShamsi = addMonthsToDateShamsi(shamsiBeltDate, durationMonths);
    const nextBeltDateMiladi = shmasiToMiladi(nextBeltDateShamsi);
    return new Date(nextBeltDateMiladi);
  }

  async test() {
    const date = new Date('1999-09-13');
    console.log();
    // console.log(addMonthsToDateShamsi);
    return 'tes';
  }
}
