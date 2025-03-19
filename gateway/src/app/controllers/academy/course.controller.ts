import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateCoursesDto, QueryCoursesDto, UpdateCoursesDto } from '../../../common/dtos/academy-service/courses.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { CoursePatterns } from '../../../common/enums/academy-service/academy.event';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { UploadFileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('courses')
@ApiTags('Courses')
@AuthDecorator()
export class CoursesController {
  constructor(@Inject(Services.ACADEMY) private readonly coursesServiceClient: ClientProxy) {}

  @Post()
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @GetUser() user: User,
    @Body() createCoursesDto: CreateCoursesDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient
          .send(CoursePatterns.CREATE, {
            user,
            createCoursesDto: { ...createCoursesDto, image },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create student', 'CoursesService');
    }
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoursesDto: UpdateCoursesDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient
          .send(CoursePatterns.UPDATE, {
            user,
            studentId: id,
            updateCoursesDto: { ...updateCoursesDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated student', 'CoursesService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryCoursesDto: QueryCoursesDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient.send(CoursePatterns.GET_ALL, { user, queryCoursesDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient.send(CoursePatterns.GET_ONE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get student', 'CoursesService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient.send(CoursePatterns.REMOVE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'CoursesService');
    }
  }
}
