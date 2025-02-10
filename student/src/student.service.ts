import { HttpStatus, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
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

    try {
      await this.checkExistStudentByNationalCode(createStudentDto.national_code);

      const userId = await this.createUser();

      const uploadedImageKey = await this.uploadStudentImage(createStudentDto.image);

      const student = this.studentRepo.create({
        ...createStudentDto,
        image_url: uploadedImageKey,
        user_id: userId,
      });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();

      return ResponseUtil.success({ ...student, user_id: userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      return ResponseUtil.error(error?.message || StudentMessages.FailedToCreateStudent, error?.status || HttpStatus.INTERNAL_SERVER_ERROR);
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

  private async uploadStudentImage(image: any): Promise<string | null> {
    if (!image) return null;

    try {
      const uploadedImage = await this.awsService.uploadSingleFile({ file: image, folderName: 'students' });

      if (uploadedImage?.error) {
        return null;
      }

      return uploadedImage.key;
    } catch (error) {
      return null;
    }
  }

  async removeStudentById(userDto: { studentId: number }): Promise<ServiceResponse> {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    try {
      const existingStudent = await this.checkExistStudentById(userDto.studentId);
      if (!existingStudent) {
        return ResponseUtil.error(StudentMessages.NotFoundStudent, HttpStatus.CONFLICT);
      }

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

  async checkExistStudentById(studentId: number) {
    return await this.studentRepo.findOneBy({ id: studentId });
  }
  async checkExistStudentByNationalCode(nationalCode: string) {
    const isExist = await this.studentRepo.existsBy({ national_code: nationalCode });

    if (isExist) {
      throw ResponseUtil.error(StudentMessages.DuplicateNationalCode, HttpStatus.CONFLICT);
    }
  }
}
