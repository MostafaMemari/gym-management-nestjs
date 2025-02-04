import { Controller } from "@nestjs/common";
import { StudentService } from "./student.service";
import { MessagePattern } from "@nestjs/microservices";
import { StudentPatterns } from "./common/validation/enums/student.events";

@Controller()
export class StudentController {
  constructor(private readonly StudentService: StudentService) {}

  @MessagePattern(StudentPatterns.getHello)
  getHello(): string {
    return this.StudentService.getHello();
  }

  @MessagePattern(StudentPatterns.checkConnection)
  checkConnection() {
    return true;
  }
}
