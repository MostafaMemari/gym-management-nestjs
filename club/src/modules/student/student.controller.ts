import { Controller, UsePipes } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateStudent, ISeachStudentQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { StudentService } from './student.service';

import { IPagination } from '../../common/interfaces/pagination.interface';
import { IUser } from '../../common/interfaces/user.interface';
import { ValidateStudentUpdatePipe } from './pipes/studentUpdate.pipe';
import { ValidateStudentCreatePipe } from './pipes/studentCreate.pipe';
import { StudentEntity } from './entities/student.entity';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateStudent)
  @UsePipes(ValidateStudentCreatePipe)
  create(@Payload() data: { user: IUser; createStudentDto: ICreateStudent }) {
    const { createStudentDto } = data;

    return this.studentService.create(createStudentDto);
  }
  @MessagePattern(StudentPatterns.UpdateStudent)
  @UsePipes(ValidateStudentUpdatePipe)
  update(@Payload() data: { updateStudentDto: IUpdateStudent; student: StudentEntity }) {
    const { updateStudentDto, student } = data;

    return this.studentService.update(updateStudentDto, student);
  }

  @MessagePattern(StudentPatterns.GetStudent)
  findOne(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.findOneById(user, studentId);
  }

  @MessagePattern(StudentPatterns.GetStudents)
  findAll(@Payload() data: { user: IUser; studentQueryDto: ISeachStudentQuery; paginationDto: IPagination }) {
    const { user, studentQueryDto, paginationDto } = data;

    return this.studentService.getAll(user, { studentQueryDto, paginationDto });
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  remove(@Payload() data: { user: IUser; studentId: number }) {
    const { user, studentId } = data;

    return this.studentService.removeById(user, studentId);
  }

  // @MessagePattern(StudentPatterns.checkExistStudentById)
  // checkExistById(@Payload() data: { user: IUser; studentId: number }) {
  //   return this.studentService.findStudentById(data.studentId, {});
  // }
}
