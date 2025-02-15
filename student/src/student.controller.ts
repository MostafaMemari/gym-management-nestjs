import { Controller } from '@nestjs/common';
import { StudentService } from './student.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { StudentPatterns } from './common/enums/student.events';
import { ICreateStudent, IQuery } from './common/interfaces/student.interface';
@Controller()
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @MessagePattern(StudentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(StudentPatterns.CreateStudent)
  create(@Payload() createStudentDto: ICreateStudent) {
    return this.studentService.create(createStudentDto);
  }
  @MessagePattern(StudentPatterns.UpdateStudent)
  update(@Payload() createStudentDto: ICreateStudent) {
    return this.studentService.updateById(createStudentDto);
  }

  @MessagePattern(StudentPatterns.GetStudents)
  findAll(@Payload() query: IQuery) {
    return this.studentService.getAll(query);
  }

  @MessagePattern(StudentPatterns.RemoveUserStudent)
  remove(@Payload() data: { studentId: number }) {
    return this.studentService.removeById(data);
  }

  @MessagePattern(StudentPatterns.checkExistStudentById)
  checkExistById(@Payload() data: { studentId: number }) {
    return this.studentService.findStudentById(data.studentId, {});
  }
}
