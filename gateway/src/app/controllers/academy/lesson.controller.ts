import {
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
import { ChapterPatterns, LessonPatterns } from '../../../common/enums/academy-service/academy.event';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFileFields } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { FilesValidationPipe } from '../../../common/pipes/upload-files.pipe';
import { AwsService } from '../../../modules/s3AWS/s3AWS.service';
import { AccessRole } from '../../../common/decorators/accessRole.decorator';
import { Role } from '../../../common/enums/auth-user-service/role.enum';
import { Roles } from '../../../common/decorators/role.decorator';

@Controller('lessons')
@ApiTags('Lessons')
@AuthDecorator()
export class LessonController {
  constructor(
    @Inject(Services.ACADEMY) private readonly academyServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Post('chapter/:chapterId')
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
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @Param('chapterId', ParseIntPipe) chapterId: number,
    @Body() createLessonDto: CreateLessonDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File; video?: Express.Multer.File },
  ) {
    let coverImageData: { url: string; key: string } | null = null;
    let videoData: { url: string; key: string } | null = null;

    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);
      const chapter = await this.findChapterById(chapterId);
      const courseId = chapter.courseId;
      const tempFolder = `academy/course/${courseId}/chapter/${chapterId}/lesson/temp`;

      if (files.cover_image) {
        coverImageData = await this.awsService.uploadTempFile(files.cover_image[0], tempFolder);
      }
      if (files.video) {
        videoData = await this.awsService.uploadTempFile(files.video[0], tempFolder);
      }

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(LessonPatterns.CREATE, {
            chapterId,
            createLessonDto: { ...createLessonDto, cover_image: coverImageData?.key || null, video: videoData?.key || null },
          })
          .pipe(timeout(5000)),
      );

      if (!data.error && data.data?.id) {
        const lessonId = data.data.id;

        data.data.cover_image = coverImageData ? (await this.awsService.moveFileToCourseFolder(coverImageData.key, lessonId)).key : null;
        data.data.video = videoData ? (await this.awsService.moveFileToCourseFolder(videoData.key, lessonId)).key : null;

        await lastValueFrom(
          this.academyServiceClient.send(LessonPatterns.UPDATE, {
            lessonId,
            updateLessonDto: {
              cover_image: data.data.cover_image || null,
              video: data.data.video || null,
            },
          }),
        );
      }

      return handleServiceResponse(data);
    } catch (error) {
      if (coverImageData) await this.awsService.removeFile(coverImageData.key);
      if (videoData) await this.awsService.removeFile(videoData.key);

      handleError(error, 'Failed to create lesson', 'LessonService');
    }
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
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
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
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryLessonDto: QueryLessonDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.GET_ALL, { user, queryLessonDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get lesson', 'LessonService');
    }
  }

  @Get(':id')
  @AccessRole(Role.SUPER_ADMIN)
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
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.REMOVE, { user, lessonId: id }).pipe(timeout(5000)),
      );

      if (!data.error) {
        const lesson = data.data;
        if (lesson?.cover_image) this.removeFile(lesson?.cover_image);
        if (lesson?.video) this.removeFile(lesson?.video);
      }

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove lesson', 'LessonService');
    }
  }

  @Post(':id/complete')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async completeLesson(@GetUser() user: User, @Param('id') id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(LessonPatterns.MARK_LESSON_COMPLETED, { user, lessonId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove lesson', 'LessonService');
    }
  }

  private async findChapterById(chapterId: number) {
    const result = await lastValueFrom(this.academyServiceClient.send(ChapterPatterns.GET_ONE, { chapterId }).pipe(timeout(5000)));

    if (result?.error) throw handleError(result.error, result.message, 'LessonService');

    return result.data;
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
