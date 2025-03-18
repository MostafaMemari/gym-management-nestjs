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
import { CreateLessonDto, QueryLessonDto, UpdateLessonDto } from '../../../common/dtos/academy-service/lesson.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { LessonPatterns } from '../../../common/enums/academy-service/academy.event';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { UploadFileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('lessons')
@ApiTags('Lessons')
@AuthDecorator()
export class LessonController {
  constructor(@Inject(Services.ACADEMY) private readonly lessonServiceClient: ClientProxy) {}

  @Post()
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @GetUser() user: User,
    @Body() createLessonDto: CreateLessonDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient
          .send(LessonPatterns.CREATE, {
            user,
            createLessonDto: { ...createLessonDto, image },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create student', 'LessonService');
    }
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient
          .send(LessonPatterns.UPDATE, {
            user,
            studentId: id,
            updateLessonDto: { ...updateLessonDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated student', 'LessonService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryLessonDto: QueryLessonDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient.send(LessonPatterns.GET_ALL, { user, queryLessonDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient.send(LessonPatterns.GET_ONE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get student', 'LessonService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient.send(LessonPatterns.REMOVE, { user, studentId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove student', 'LessonService');
    }
  }

  // @Post(':id/upload')
  // @UseInterceptors(FilesInterceptor('files'))
  // @ApiOperation({ summary: 'آپلود ویدیو یا مستندات برای یک درس' })
  // async uploadFiles(@Param('id') id: number, @UploadedFiles() files: Express.Multer.File[]): Promise<string[]> {
  //   return files.map((file) => file.filename);
  // }
}
