import { HttpStatus, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ICreateStudent } from './common/interfaces/student.interface';
import { StudentMessages } from './common/enums/student.messages';
import { Services } from './common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { InjectRepository } from '@nestjs/typeorm';
import { Student } from './entities/student.entity';
import { DataSource, Repository } from 'typeorm';
import { lastValueFrom, timeout } from 'rxjs';
import { StudentPatterns } from './common/enums/student.events';
import { UserPatterns } from './common/enums/user.events';

@Injectable()
export class StudentService {
  private readonly timeout: number = 4500;

  constructor(
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRepository(Student) private studentRepo: Repository<Student>,
  ) {}
  async createStudent(createStudentDto: ICreateStudent) {
    const queryRunner = this.studentRepo.manager.connection.createQueryRunner();
    await queryRunner.startTransaction();

    const data = { username: `STU_${Math.random() * 10}` };

    let userId: number;

    try {
      const result = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.CreateUserStudent, data).pipe(timeout(this.timeout)),
      );

      if (result?.error) return result;

      userId = result?.data?.user?.id;

      const student = this.studentRepo.create({
        ...createStudentDto,
        user_id: userId,
      });

      await queryRunner.manager.save(student);

      await queryRunner.commitTransaction();

      return true;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      lastValueFrom(this.userServiceClientProxy.send(UserPatterns.RemoveUser, { userId }).pipe(timeout(this.timeout)));

      return 'خطایی در ثبت اطلاعات رخ داد';
    } finally {
      await queryRunner.release();
    }
  }
}
