import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateStudent, IQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { ValidateStudentDataPipe } from './pipes/validate-data.pipe';
import { StudentService } from './student.service';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateStudent)
  @UsePipes(ValidateStudentDataPipe)
  // @UsePipes(ValidateNationalCodePipe)
  create(@Payload() data: { user: IUser; createStudentDto: ICreateStudent }) {
    const { user, createStudentDto } = data;

    return this.studentService.create(user, createStudentDto);
  }
  @MessagePattern(StudentPatterns.UpdateStudent)
  update(@Payload() data: { user: IUser; studentId: number; updateStudentDto: IUpdateStudent }) {
    const { user, studentId, updateStudentDto } = data;

    return this.studentService.updateById(user, studentId, updateStudentDto);
  }

  @MessagePattern(StudentPatterns.GetStudents)
  findAll(@Payload() data: { user: IUser; queryDto: IQuery; paginationDto: IPagination }) {
    const { user, queryDto, paginationDto } = data;

    return this.studentService.getAll(user, { queryDto, paginationDto });
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  findOne(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.findOneById(user, studentId);
  }

  @MessagePattern(StudentPatterns.GetStudent)
  remove(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.removeById(user, studentId);
  }

  @MessagePattern(StudentPatterns.checkExistStudentById)
  checkExistById(@Payload() data: { user: IUser; studentId: number }) {
    return this.studentService.findStudentById(data.studentId, {});
  }
}
