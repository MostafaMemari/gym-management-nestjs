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
  UploadedFiles,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
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
import { FileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { UserLessonProgressDto } from '../../../common/dtos/academy-service/user-lesson-progress.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesValidationPipe } from 'src/common/pipes/upload-files.pipe';

@Controller('lessons')
@ApiTags('Lessons')
@AuthDecorator()
export class LessonController {
  constructor(@Inject(Services.ACADEMY) private readonly lessonServiceClient: ClientProxy) {}
  @Post()
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'cover_image', maxCount: 1 },
      { name: 'video', maxCount: 1 },
    ]),
  )
  @UsePipes(
    new FilesValidationPipe({
      cover_image: { types: ['image/jpeg', 'image/png'], maxSize: 10 * 1024 * 1024 },
      video: { types: ['video/mp4'], maxSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @GetUser() user: User,
    @Body() createLessonDto: CreateLessonDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File[]; video?: Express.Multer.File[] },
  ) {
    try {
      console.log('Received Files:', files);
      console.log('Cover Image:', files.cover_image ? files.cover_image[0] : 'No cover image uploaded');
      console.log('Video:', files.video ? files.video[0] : 'No video uploaded');

      return {
        ...createLessonDto,
        cover_image: files.cover_image ? files.cover_image[0] : null,
        video: files.video ? files.video[0] : null,
      };

      // await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      // const data: ServiceResponse = await lastValueFrom(
      //   this.lessonServiceClient
      //     .send(LessonPatterns.CREATE, {
      //       user,
      //       createLessonDto: {
      //         ...createLessonDto,
      //         cover_image: files.cover_image ? files.cover_image[0] : null,
      //         video: files.video ? files.video[0] : null,
      //       },
      //     })
      //     .pipe(timeout(10000)),
      // );

      // return handleServiceResponse(data);
    } catch (error) {
      if (error instanceof BadRequestException) {
        return {
          message: error.message,
          error: 'Invalid file format or size',
          statusCode: 400,
        };
      }
      handleError(error, 'Failed to create lesson', 'LessonService');

      throw error;
    }
  }

  @Get('chapter/:chapterId')
  @ApiParam({ name: 'chapterId', type: 'number' })
  getByChapter(@Param('chapterId') chapterId: number) {
    // return this.lessonService.getByChapter(chapterId);
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient
          .send(LessonPatterns.UPDATE, {
            user,
            lessonId: id,
            updateLessonDto: { ...updateLessonDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated lesson', 'LessonService');
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
        this.lessonServiceClient.send(LessonPatterns.GET_ONE, { user, lessonId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get lesson', 'LessonService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.lessonServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.lessonServiceClient.send(LessonPatterns.REMOVE, { user, lessonId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove lesson', 'LessonService');
    }
  }

  @Put('progress')
  updateProgress(@Body() dto: UserLessonProgressDto) {
    // return this.lessonService.updateProgress(dto);
  }
}
