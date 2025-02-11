import { BadRequestException, HttpStatus, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICreateStudent } from './common/interfaces/student.interface';
import { StudentMessages } from './common/enums/student.messages';
import { Services } from './common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { StudentEntity } from './entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { StudentPatterns } from './common/enums/student.events';
import { UserPatterns } from './common/enums/user.events';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { ResponseUtil } from './common/utils/response';
import { AwsService } from './modules/s3AWS/s3AWS.service';

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
    private readonly awsService: AwsService,
  ) {}

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)));
    } catch (error) {
      throw new RpcException({ message: 'User service is not connected', status: HttpStatus.INTERNAL_SERVER_ERROR });
    }
  }

  async createStudent(createStudentDto: ICreateStudent) {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();
    let userId = null;
    let imageKey = null;

    try {
      await this.checkExistByNationalCode(createStudentDto.national_code);
      userId = await this.createUser();

      imageKey = await this.uploadStudentImage(createStudentDto.image);

      const student = this.studentRepo.create({
        ...createStudentDto,
        image_url: imageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(student);
      throw new Error('شبیه‌سازی خطا در ذخیره دانش‌آموز');

      return ResponseUtil.success({ ...student, user_id: userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await this.removeUser(userId);
      await this.removeStudentImage(imageKey);
      ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
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

  private async removeUser(userId: number) {
    await this.checkUserServiceConnection();
    const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
    if (result?.error) throw result;
  }

  private async uploadStudentImage(image: any): Promise<string | null> {
    if (!image) return null;

    const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });

    return uploadedImage.key;
  }
  private async removeStudentImage(imageKey: any): Promise<string | null> {
    if (!imageKey) return null;

    const uploadedImage = await this.awsService.deleteFile(imageKey);
    console.log(uploadedImage);
  }

  async removeStudentById(userDto: { studentId: number }): Promise<ServiceResponse> {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const existingStudent = await this.checkExistById(userDto.studentId);
      if (!existingStudent) ResponseUtil.error(StudentMessages.NotFoundStudent, HttpStatus.CONFLICT);

      const removedUser = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId: existingStudent.user_id }).pipe(timeout(this.timeout)),
      );

      if (removedUser.error) {
        await queryRunner.rollbackTransaction();
        return removedUser;
      }

      await queryRunner.manager.delete(StudentEntity, existingStudent.id);
      await queryRunner.commitTransaction();

      return ResponseUtil.success(existingStudent, StudentMessages.RemovedStudentSuccess);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new RpcException(error);
    } finally {
      await queryRunner.release();
    }
  }

  async checkExistById(studentId: number) {
    return await this.studentRepo.findOneBy({ id: studentId });
  }
  async checkExistByNationalCode(nationalCode: string) {
    const isExist = await this.studentRepo.existsBy({ national_code: nationalCode });

    if (isExist) ResponseUtil.error(StudentMessages.DuplicateNationalCode, HttpStatus.CONFLICT);
  }
}
