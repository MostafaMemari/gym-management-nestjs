import { Controller } from '@nestjs/common';
import { StudentService } from './student.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StudentPatterns } from './common/enums/student.events';
import { ICreateStudent, IQuery, IUpdateStudent } from './common/interfaces/student.interface';
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
  findAll(@Payload() query: IQuery) {
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
