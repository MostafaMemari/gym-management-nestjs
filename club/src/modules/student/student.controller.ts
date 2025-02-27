import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateStudent, ISeachStudentQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { StudentService } from './student.service';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { StudentEntity } from './entities/student.entity';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateStudent)
  create(@Payload() data: { user: IUser; createStudentDto: ICreateStudent }) {
    const { user, createStudentDto } = data;

    return this.studentService.create(user, createStudentDto);
  }
  @MessagePattern(StudentPatterns.UpdateStudent)
  update(@Payload() data: { user: IUser; studentId: number; updateStudentDto: IUpdateStudent }) {
    const { user, studentId, updateStudentDto } = data;

    return this.studentService.update(user, studentId, updateStudentDto);
  }

  @MessagePattern(StudentPatterns.GetStudent)
  findOne(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.findOneById(user, studentId);
  }

  @MessagePattern(StudentPatterns.GetStudents)
  findAll(@Payload() data: { user: IUser; queryStudentDto: ISeachStudentQuery; paginationDto: IPagination }) {
    const { user, queryStudentDto, paginationDto } = data;

    return this.studentService.getAll(user, { queryStudentDto, paginationDto });
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  remove(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.removeById(user, studentId);
  }
}
