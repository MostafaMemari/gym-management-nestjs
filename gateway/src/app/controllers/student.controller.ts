import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  Inject,
  InternalServerErrorException,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { StudentPatterns } from '../../common/enums/student.events';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { CreateStudentDto, UpdateStudentDto } from '../../common/dtos/student.dto';
import { UploadFileS3 } from '../../common/interceptors/upload-file.interceptor';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { PaginationDto } from 'src/common/dtos/shared.dto';
import { UploadFileValidationPipe } from 'src/common/pipes/upload-file.pipe';
import { SwaggerConsumes } from 'src/common/enums/swagger-consumes.enum';

@Controller('students')
@ApiTags('Students')
export class StudentController {
  constructor(@Inject(Services.STUDENT) private readonly studentServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.studentServiceClient.send(StudentPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Student service is not connected');
    }
  }

  @Post()
  @UseInterceptors(UploadFileS3('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @Body() createStudentDto: CreateStudentDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)')) image: Express.Multer.File,
  ) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.studentServiceClient
          .send(StudentPatterns.CreateStudent, { createStudentDto: { ...createStudentDto, image } })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create student', 'StudentService');
    }
  }

  @Put(':id')
  @UseInterceptors(UploadFileS3('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)')) image: Express.Multer.File,
  ) {
    try {
      await this.checkConnection();
      console.log(updateStudentDto);
      const data: ServiceResponse = await lastValueFrom(
        this.studentServiceClient
          .send(StudentPatterns.UpdateStudent, { studentId: id, updateStudentDto: { ...updateStudentDto, image } })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'StudentService');
    }
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto): Promise<any> {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.studentServiceClient.send(StudentPatterns.GetStudents, { paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.studentServiceClient.send(StudentPatterns.RemoveUserStudent, { studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'StudentService');
    }
  }
}
