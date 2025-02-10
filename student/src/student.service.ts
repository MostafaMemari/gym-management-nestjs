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

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(StudentEntity) private studentRepo: Repository<StudentEntity>,
  ) {}
  async createStudent(createStudentDto: ICreateStudent) {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const data = { username: `STU_${Date.now()}_${Math.floor(Math.random() * 1000)}` };

    let userId: number;

    try {
      const result = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.CreateUserStudent, data).pipe(timeout(this.timeout)),
      );

      if (result?.error) {
        await queryRunner.rollbackTransaction();
        return result;
      }

      const existingStudent = await this.checkExistStudentByNationalCode(createStudentDto.national_code);
      if (existingStudent) {
        await queryRunner.rollbackTransaction();
        return ResponseUtil.error(StudentMessages.DuplicateNationalCode, HttpStatus.CONFLICT);
      }

      userId = result?.data?.user?.id;
      const student = this.studentRepo.create({ ...createStudentDto, user_id: userId });

      await queryRunner.manager.save(student);
      await queryRunner.commitTransaction();

      return ResponseUtil.success({ ...student, user_id: userId }, StudentMessages.CreatedStudent);
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (userId) {
        await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));
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
