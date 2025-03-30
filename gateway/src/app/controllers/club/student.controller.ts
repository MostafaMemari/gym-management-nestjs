import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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
import {
  BulkCreateStudentsDto,
  CreateStudentByAdminDto,
  CreateStudentByCoachDto,
  QueryStudentDto,
  UpdateStudentByAdminDto,
  UpdateStudentByCoachDto,
} from '../../../common/dtos/club-service/student.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { StudentPatterns } from '../../../common/enums/club-service/gym.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { FileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('students')
@ApiTags('Students')
@AuthDecorator()
export class StudentController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post('admin')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async createByAdmin(
    @GetUser() user: User,
    @Body() createStudentDto: CreateStudentByAdminDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.CREATE, {
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
  @Post('coach')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async createByCoach(
    @GetUser() user: User,
    @Body() createStudentDto: CreateStudentByCoachDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.CREATE, {
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

  @Put(':id/admin')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async updateByAdmin(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentByAdminDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.UPDATE, {
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

  @Put(':id/coach')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async updateByCoach(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStudentDto: UpdateStudentByCoachDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.UPDATE, {
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
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.GET_ALL, { user, queryStudentDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }
  @Get('summary')
  async findAllSummary(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryStudentDto: QueryStudentDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.GET_ALL_SUMMARY, { user, queryStudentDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.GET_ONE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get student', 'StudentService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(StudentPatterns.REMOVE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'StudentService');
    }
  }

  @Post('bulk')
  @ApiConsumes(SwaggerConsumes.MultipartData)
  @UseInterceptors(UploadFile('studentsFile'))
  async bulkUpload(
    @GetUser() user: User,
    @Body() bulkStudentsDto: BulkCreateStudentsDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['application/json']))
    studentsFile: Express.Multer.File,
  ) {
    try {
      if (!studentsFile) throw new BadRequestException('student file required');
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(StudentPatterns.BULK_CREATE, {
            user,
            studentData: { ...bulkStudentsDto },
            studentsJson: studentsFile,
          })
          .pipe(timeout(40000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to bulk upload students', 'StudentService');
    }
  }
}
