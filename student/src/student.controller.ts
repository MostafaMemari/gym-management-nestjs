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

  @MessagePattern(StudentPatterns.CreateStudent)
  createStudent(@Payload() data: ICreateStudent) {
    return this.studentService.createStudent(data);
    // return true;
  }
}
