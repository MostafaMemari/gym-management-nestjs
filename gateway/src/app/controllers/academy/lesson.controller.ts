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
import { UploadFile, UploadFileFields } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { FileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { UserLessonProgressDto } from '../../../common/dtos/academy-service/user-lesson-progress.dto';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { FilesValidationPipe } from '../../../common/pipes/upload-files.pipe';
import { AwsService } from '../../../modules/s3AWS/s3AWS.service';

@Controller('lessons')
@ApiTags('Lessons')
@AuthDecorator()
export class LessonController {
  constructor(
    @Inject(Services.ACADEMY) private readonly academyServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Post()
  @UseInterceptors(
    UploadFileFields([
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
    @UploadedFiles() files: { cover_image?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    let image_cover_key: string | null = null;
    let video_key: string | null = null;

    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      image_cover_key = files.cover_image ? await this.uploadFile(files.cover_image[0], 'academy/lesson/image_cover') : null;
      video_key = files.video ? await this.uploadFile(files.video[0], 'academy/lesson/video') : null;

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(LessonPatterns.CREATE, {
            user,
            createLessonDto: { ...createLessonDto, image_cover_key, video_key },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      await this.removeFile(image_cover_key);
      await this.removeFile(video_key);
      console.log(error.message);
      handleError(error, 'Failed to create lesson', 'LessonService');
    }
  }

  @Get('chapter/:chapterId')
  @ApiParam({ name: 'chapterId', type: 'number' })
  getByChapter(@Param('chapterId') chapterId: number) {
    // return this.lessonService.getByChapter(chapterId);
  }

  @Put(':id')
  @UseInterceptors(
    UploadFileFields([
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
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLessonDto: UpdateLessonDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    let cover_image: string | null = null;
    let video: string | null = null;

    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);
      const lesson = await this.findById(id);

      cover_image = files.cover_image ? await this.uploadFile(files.cover_image[0], 'academy/lesson/image_cover') : null;
      video = files.video ? await this.uploadFile(files.video[0], 'academy/lesson/video') : null;

      const updatedData = { ...updateLessonDto };
      if (cover_image) updatedData.cover_image = cover_image;
      if (video) updatedData.video = video;

      Object.assign(lesson, updatedData);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(LessonPatterns.UPDATE, {
            lessonId: id,
            updateLessonDto: lesson,
          })
          .pipe(timeout(5000)),
      );

      if (cover_image) await this.removeFile(lesson.cover_image);
      if (video) await this.removeFile(lesson.video);

      return handleServiceResponse(data);
    } catch (error) {
      await this.removeFile(cover_image);
      await this.removeFile(video);
      handleError(error, 'Failed to update lesson', 'LessonService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryLessonDto: QueryLessonDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.GET_ALL, { user, queryLessonDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.GET_ONE, { user, lessonId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get lesson', 'LessonService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.REMOVE, { user, lessonId: id }).pipe(timeout(5000)),
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

  private async findById(id: number) {
    const result = await lastValueFrom(this.academyServiceClient.send(LessonPatterns.GET_ONE, { lessonId: id }).pipe(timeout(5000)));

    if (result?.error) throw result;

    return result.data;
  }

  private async uploadFile(file: Express.Multer.File, folderName: string): Promise<string | undefined> {
    if (!file) return;

    const uploadedFile = await this.awsService.uploadSingleFile({ file, folderName });
    return uploadedFile.key;
  }

  private async removeFile(fileKey: string): Promise<void> {
    if (!fileKey) return;
    await this.awsService.removeFile(fileKey);
  }
}
