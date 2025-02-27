import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateStudentDto, QueryStudentDto, UpdateStudentDto } from '../../../common/dtos/club-service/student.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { User } from '../../../common/dtos/user.dto';
import { StudentPatterns } from '../../../common/enums/club.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFileS3 } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { UploadFileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('students')
@ApiTags('Students')
@AuthDecorator()
export class StudentController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.clubServiceClient.send(StudentPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Student service is not connected');
    }
  }

  @Post()
  @UseInterceptors(UploadFileS3('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @GetUser() user: User,
    @Body() createStudentDto: CreateStudentDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.CreateStudent, {
            user,
            createStudentDto: { ...createStudentDto, image },
          })
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
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.UpdateStudent, {
            user,
            studentId: id,
            updateStudentDto: { ...updateStudentDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated student', 'StudentService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryStudentDto: QueryStudentDto): Promise<any> {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.GetStudents, { user, queryStudentDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.GetStudent, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get student', 'StudentService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.RemoveUserStudent, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'StudentService');
    }
  }
}
