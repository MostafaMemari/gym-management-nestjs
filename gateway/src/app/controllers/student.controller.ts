import { Controller, Get, HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiTags } from "@nestjs/swagger";
import { StudentPatterns } from "../../common/enums/student.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";

@Controller("student")
@ApiTags("Student")
export class StudentController {
  constructor(@Inject(Services.STUDENT) private readonly studentServiceClient: ClientProxy) {}

  async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.studentServiceClient.send(StudentPatterns.checkConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException("Student service is not connected");
    }
  }

  @Get("hello")
  async getHello() {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(this.studentServiceClient.send(StudentPatterns.getHello, {}).pipe(timeout(5000)));

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }
}
