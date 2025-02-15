import { ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ICreateStudent, IQuery } from './common/interfaces/student.interface';
import { StudentMessages } from './common/enums/student.messages';
import { Services } from './common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { UserPatterns } from './common/enums/user.events';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { ResponseUtil } from './common/utils/response';
import { AwsService } from './modules/s3AWS/s3AWS.service';
import { EntityName } from './common/enums/entity.enum';
import { PageDto, PageMetaDto } from './common/dtos/pagination.dto';
import { CacheService } from './modules/cache/cache.service';
import { CacheKeys } from './modules/cache/enums/cache.enum';

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
      await this.findStudentByNationalCode(createStudentDto.national_code, { duplicateError: true });

      imageKey = await this.uploadStudentImage(createStudentDto.image);

      userId = await this.createUser();

      const student = this.studentRepository.create({
        ...createStudentDto,
        image_url: imageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();

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
  async updateById(createStudentDto: ICreateStudent) {
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    let userId = null;
    let imageKey = null;

    try {
      await this.findStudentByNationalCode(createStudentDto.national_code, { duplicateError: true });

      imageKey = await this.uploadStudentImage(createStudentDto.image);

      userId = await this.createUser();

      const student = this.studentRepository.create({
        ...createStudentDto,
        image_url: imageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();

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
  async getAll(query: IQuery): Promise<PageDto<StudentEntity>> {
    const { take, page } = query.paginationDto;
    const cacheKey = `${CacheKeys.STUDENT_LIST}-${page}-${take}`;

    const cachedData = await this.cacheService.get<PageDto<StudentEntity>>(cacheKey);

    if (cachedData) return cachedData;

    const queryBuilder = this.studentRepository.createQueryBuilder(EntityName.Students);

    const [students, count] = await queryBuilder
      .skip((page - 1) * take)
      .take(take)
      .getManyAndCount();

    const pageMetaDto = new PageMetaDto(count, query?.paginationDto);
    const result = new PageDto(students, pageMetaDto);

    await this.cacheService.set(cacheKey, result);

    return result;
  }
  async removeById(userDto: { studentId: number }): Promise<ServiceResponse> {
    const queryRunner = this.studentRepository.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const student = await this.findStudentById(userDto.studentId, { notFoundError: true });

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
}
