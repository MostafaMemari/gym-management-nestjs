import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  HttpException,
  Inject,
  InternalServerErrorException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { StudentPatterns } from '../../common/enums/student.events';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { CreateStudentDto } from '../../common/dtos/student.dto';
import { SwaggerConsumes } from '../../common/enums/swagger-consumes.enum';
import { UploadFileS3 } from 'src/common/interceptors/upload-file.interceptor';

@Controller('students')
@ApiTags('Students')
export class StudentController {
  constructor(@Inject(Services.STUDENT) private readonly studentServiceClient: ClientProxy) {}

  async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.studentServiceClient.send(StudentPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Student service is not connected');
    }
  }

  @Post()
  @UseInterceptors(UploadFileS3('image'))
  @ApiConsumes('multipart/form-data')
  async createStudent(
    @Body() studentDto: CreateStudentDto,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: false,
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: 'image/(png|jpg|jpeg|webp)' }),
        ],
      }),
    )
    image: Express.Multer.File,
  ) {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.studentServiceClient.send(StudentPatterns.CreateUserStudent, { ...studentDto, image }).pipe(timeout(5000)),
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }

  @Delete(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.studentServiceClient.send(StudentPatterns.RemoveUserStudent, { studentId: id }).pipe(timeout(5000)),
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }
}
