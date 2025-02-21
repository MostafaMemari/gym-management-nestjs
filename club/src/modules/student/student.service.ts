import { ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { Repository } from 'typeorm';

import { PageDto, PageMetaDto } from '../../common/dtos/pagination.dto';
import { EntityName } from '../../common/enums/entity.enum';
import { UserPatterns } from '../../common/enums/patterns.events';
import { Services } from '../../common/enums/services.enum';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response';
import { CacheService } from '../cache/cache.service';
import { CacheKeys, CachePatterns } from '../cache/enums/cache.enum';
import { AwsService } from '../s3AWS/s3AWS.service';
import { StudentEntity } from './entities/student.entity';
import { StudentMessages } from './enums/student.message';
import { ICreateStudent, IStudentQuery, IUpdateStudent } from './interfaces/student.interface';

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(StudentEntity) private studentRepository: Repository<StudentEntity>,
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
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    let userId = null;
    let imageKey = null;

    try {
      imageKey = await this.uploadStudentImage(createStudentDto.image);

      // userId = await this.createUser();
      //! TODO: Remove fake userId method
      userId = Math.floor(10000 + Math.random() * 900000);

      const student = this.studentRepository.create({
        ...createStudentDto,
        image_url: imageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();
      this.clearUsersCache();

      return ResponseUtil.success({ ...student, user_id: userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeUserById(userId);
      await this.removeStudentImage(imageKey);
      ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await queryRunner.release();
    }
  }
  async updateById(studentId: number, updateStudentDto: IUpdateStudent) {
    let imageKey: string | null = null;
    let updateData: Partial<StudentEntity> = {};

    try {
      const student = await this.findStudentById(studentId, { notFoundError: true });

      Object.keys(updateStudentDto).forEach((key) => {
        if (updateStudentDto[key] !== undefined && updateStudentDto[key] !== student[key]) {
          updateData[key] = updateStudentDto[key];
        }
      });

      if (updateStudentDto.image) {
        imageKey = await this.uploadStudentImage(updateStudentDto.image);
        updateData.image_url = imageKey;
      }

      if (Object.keys(updateData).length > 0) {
        await this.studentRepository.update(studentId, updateData);
      }

      if (updateStudentDto.image && student.image_url) {
        await this.awsService.deleteFile(student.image_url);
      }

      this.clearUsersCache();
      return ResponseUtil.success({ ...student, ...updateData }, StudentMessages.UpdatedStudent);
    } catch (error) {
      await this.removeStudentImage(imageKey);

      return ResponseUtil.error(error?.message || StudentMessages.FailedToUpdateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAll(query: IStudentQuery): Promise<PageDto<StudentEntity>> {
    const { take, page } = query.paginationDto;
    const cacheKey = `${CacheKeys.STUDENT_LIST}-${page}-${take}`;

    const cachedData = await this.cacheService.get<PageDto<StudentEntity>>(cacheKey);
    if (cachedData) return cachedData;

    const queryBuilder = this.studentRepository.createQueryBuilder(EntityName.Students);

    const [students, count] = await queryBuilder
      .leftJoin('students.coach', 'coach')
      .addSelect(['coach.id', 'coach.full_name'])
      .leftJoin('students.club', 'club')
      .addSelect(['club.id', 'club.name'])
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(students, pageMetaDto);

    await this.cacheService.set(cacheKey, result, 1);

    return result;
  }
  async findOneById(studentId: number): Promise<ServiceResponse> {
    try {
      const student = await this.findStudentById(studentId, { notFoundError: true });

      return ResponseUtil.success(student, StudentMessages.RemovedStudentSuccess);
    } catch (error) {
      throw new RpcException(error);
    }
  }
  async removeById(studentId: number): Promise<ServiceResponse> {
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const student = await this.findStudentById(studentId, { notFoundError: true });

      await this.removeUserById(Number(student?.user_id));

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

  private async createUser(): Promise<number | null> {
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

  async clearUsersCache(): Promise<void> {
    await this.cacheService.delByPattern(CachePatterns.STUDENT_LIST);
  }
}
