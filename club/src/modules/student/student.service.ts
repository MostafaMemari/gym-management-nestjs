import { BadRequestException, ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
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

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly studentRepository: StudentRepository,
    private readonly awsService: AwsService,
    private readonly cacheService: CacheService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async create(createStudentDto: ICreateStudent) {
    let userId = null;
    let imageKey = null;

    try {
      imageKey = createStudentDto?.image ? await this.uploadStudentImage(createStudentDto.image) : null;

      userId = await this.createUserCoach();

      const student = await this.studentRepository.createStudentWithTransaction({
        ...createStudentDto,
        image_url: imageKey,
        userId: userId,
      });

      return ResponseUtil.success({ ...student, userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await this.removeUserById(userId);
      await this.removeStudentImage(imageKey);
      return ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(updateStudentDto: IUpdateStudent, student: StudentEntity) {
    let imageKey: string | null = null;
    let updateData: Partial<StudentEntity> = {};

    try {
      Object.keys(updateStudentDto).forEach((key) => {
        if (key !== 'image' && updateStudentDto[key] !== undefined && updateStudentDto[key] !== student[key]) {
          updateData[key] = updateStudentDto[key];
        }
      });

      if (updateStudentDto.image) {
        imageKey = await this.uploadStudentImage(updateStudentDto.image);
        updateData.image_url = imageKey;
      }

      await this.studentRepository.updateStudent(student, updateData);

      if (updateStudentDto.image && student.image_url) {
        await this.awsService.deleteFile(student.image_url);
      }

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
      const student = await this.checkStudentOwnership(studentId, user.id);

      return ResponseUtil.success(student, StudentMessages.GetStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(user: IUser, studentId: number): Promise<ServiceResponse> {
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const student = await this.checkStudentOwnership(studentId, user.id);

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

  private async uploadStudentImage(image: any): Promise<string | null> {
    if (!image) return null;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });
    return uploadedImage.key;
  }
  private async removeStudentImage(imageKey: string): Promise<string | null> {
    if (!imageKey) return null;

    await this.awsService.deleteFile(imageKey);
  }

  async checkStudentOwnership(studentId: number, userId: number): Promise<StudentEntity> {
    const queryBuilder = this.studentRepository.createQueryBuilder(EntityName.Students);

    const student = await queryBuilder
      .where('students.id = :studentId', { studentId })
      .leftJoinAndSelect('students.club', 'club')
      .andWhere('club.ownerId = :userId', { userId })
      .getOne();

    if (!student) throw new BadRequestException(StudentMessages.StudentNotFound);

    return student;
  }

  async findStudent(field: keyof StudentEntity, value: any, notFoundError = false, duplicateError = false) {
    const student = await this.studentRepository.findOneBy({ [field]: value });

    if (!student && notFoundError) throw new NotFoundException(StudentMessages.NotFoundStudent);
    if (student && duplicateError) throw new ConflictException(StudentMessages.DuplicateNationalCode);

    return student;
  }
  async findStudentById(studentId: number, { notFoundError = false }) {
    return this.findStudent('id', studentId, notFoundError);
  }
  async findStudentByNationalCode(nationalCode: string, { duplicateError = false, notFoundError = false }) {
    return this.findStudent('national_code', nationalCode, notFoundError, duplicateError);
  }
}
