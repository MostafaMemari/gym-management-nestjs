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
  async createStudent(createStudentDto: ICreateStudent) {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const data = { username: `STU_${Date.now()}_${Math.floor(Math.random() * 1000)}` };

    let userId: number;
    let uploadedImageKey: string | null = null;

    try {
      const existingStudent = await this.checkExistStudentByNationalCode(createStudentDto.national_code);
      if (existingStudent) {
        await queryRunner.rollbackTransaction();
        return ResponseUtil.error(StudentMessages.DuplicateNationalCode, HttpStatus.CONFLICT);
      }

      const result = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.CreateUserStudent, data).pipe(timeout(this.timeout)),
      );

      if (result?.error) {
        await queryRunner.rollbackTransaction();
        return result;
      }

      if (createStudentDto?.image) {
        const updatedImage = await this.awsService.uploadSingleFile({
          file: createStudentDto.image,
          folderName: 'students',
        });

        if (updatedImage?.error) {
          await queryRunner.rollbackTransaction();
          return ResponseUtil.error(StudentMessages.FailedToUploadImage);
        }

        uploadedImageKey = updatedImage.key;
      }

      userId = result?.data?.user?.id;
      const student = this.studentRepo.create({ ...createStudentDto, image_url: uploadedImageKey, user_id: userId });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();

      return ResponseUtil.success({ ...student, user_id: userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (userId) {
        await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
      }

      if (uploadedImageKey) {
        try {
          await this.awsService.deleteFile(uploadedImageKey);
        } catch (deleteError) {
          console.error('Failed to delete uploaded image:', deleteError);
        }
      }

      return ResponseUtil.error(StudentMessages.FailedToCreateStudent);
    } finally {
      await queryRunner.release();
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
    return await this.studentRepo.findOneBy({ national_code: nationalCode });
  }
}
