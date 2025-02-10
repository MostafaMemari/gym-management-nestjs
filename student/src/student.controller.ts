import { Controller } from '@nestjs/common';
import { StudentService } from './student.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StudentPatterns } from './common/enums/student.events';
import { ICreateStudent } from './common/interfaces/student.interface';

@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateUserStudent)
  createStudent(@Payload() createStudentDto: ICreateStudent) {
    return this.studentService.createStudent(createStudentDto);
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  removeById(@Payload() data: { studentId: number }) {
    return this.studentService.removeStudentById(data);
  }

  @MessagePattern(StudentPatterns.checkExistStudentById)
  checkExistStudent(@Payload() data: { studentId: number }) {
    return this.studentService.checkExistStudentById(data.studentId);
  }
}
