import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

import { ICreateStudent, IStudentQuery, IUpdateStudent } from './interfaces/student.interface';
import { StudentPatterns } from './patterns/student.pattern';
import { StudentService } from './student.service';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateStudent)
  create(@Payload() data: { createStudentDto: ICreateStudent }) {
    const { createStudentDto } = data;
    return this.studentService.create(createStudentDto);
  }
  @MessagePattern(StudentPatterns.UpdateStudent)
  update(@Payload() data: { studentId: number; updateStudentDto: IUpdateStudent }) {
    const { studentId, updateStudentDto } = data;
    return this.studentService.updateById(studentId, updateStudentDto);
  }

  @MessagePattern(StudentPatterns.GetStudents)
  findAll(@Payload() query: IStudentQuery) {
    return this.studentService.getAll(query);
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  findOne(@Payload() data: { studentId: number }) {
    const { studentId } = data;
    return this.studentService.findOneById(studentId);
  }

  @MessagePattern(StudentPatterns.GetStudent)
  remove(@Payload() data: { studentId: number }) {
    const { studentId } = data;
    return this.studentService.removeById(studentId);
  }

  @MessagePattern(StudentPatterns.checkExistStudentById)
  checkExistById(@Payload() data: { studentId: number }) {
    return this.studentService.findStudentById(data.studentId, {});
  }
}
