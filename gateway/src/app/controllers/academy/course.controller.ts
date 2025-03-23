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
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateCourseDto, QueryCourseDto, UpdateCourseDto } from '../../../common/dtos/academy-service/courses.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { CoursePatterns } from '../../../common/enums/academy-service/academy.event';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile, UploadFileFields } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { FileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { FilesValidationPipe } from '../../../common/pipes/upload-files.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AwsService } from '../../../modules/s3AWS/s3AWS.service';
import { BeltPatterns, ClubPatterns } from 'src/common/enums/club-service/club.events';

@Controller('courses')
@ApiTags('Courses')
@AuthDecorator()
export class CoursesController {
  constructor(
    @Inject(Services.ACADEMY) private readonly academyServiceClient: ClientProxy,
    @Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Post()
  @UseInterceptors(
    UploadFileFields([
      { name: 'cover_image', maxCount: 1 },
      { name: 'intro_video', maxCount: 1 },
    ]),
  )
  @UsePipes(
    new FilesValidationPipe({
      cover_image: { types: ['image/jpeg', 'image/png'], maxSize: 10 * 1024 * 1024 },
      intro_video: { types: ['video/mp4'], maxSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File; intro_video?: Express.Multer.File },
  ) {
    let coverImageData: { url: string; key: string } | null = null;
    let introVideoData: { url: string; key: string } | null = null;

    try {
      await this.validateBeltIds(createCourseDto.beltIds);
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      if (files.cover_image) {
        coverImageData = await this.awsService.uploadTempFile(files.cover_image[0], 'academy/course/temp');
      }
      if (files.intro_video) {
        introVideoData = await this.awsService.uploadTempFile(files.intro_video[0], 'academy/course/temp');
      }

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(CoursePatterns.CREATE, {
            createCourseDto: {
              ...createCourseDto,
              cover_image: coverImageData?.key || null,
              intro_video: introVideoData?.key || null,
            },
          })
          .pipe(timeout(5000)),
      );

      if (!data.error && data.data?.id) {
        const courseId = data.data.id;

        data.data.cover_image = coverImageData ? (await this.awsService.moveFileToCourseFolder(coverImageData.key, courseId)).key : null;
        data.data.intro_video = introVideoData ? (await this.awsService.moveFileToCourseFolder(introVideoData.key, courseId)).key : null;

        await lastValueFrom(
          this.academyServiceClient.send(CoursePatterns.UPDATE, {
            courseId,
            updateCourseDto: {
              cover_image: data.data.cover_image || null,
              intro_video: data.data.intro_video || null,
            },
          }),
        );
      }

      return handleServiceResponse(data);
    } catch (error) {
      if (coverImageData) await this.awsService.removeFile(coverImageData.key);
      if (introVideoData) await this.awsService.removeFile(introVideoData.key);

      console.error(error.message);
      handleError(error, 'Failed to create course', 'CourseService');
    }
  }

  @Put(':id')
  @UseInterceptors(
    UploadFileFields([
      { name: 'cover_image', maxCount: 1 },
      { name: 'intro_video', maxCount: 1 },
    ]),
  )
  @UsePipes(
    new FilesValidationPipe({
      cover_image: { types: ['image/jpeg', 'image/png'], maxSize: 10 * 1024 * 1024 },
      intro_video: { types: ['video/mp4'], maxSize: 10 * 1024 * 1024 },
    }),
  )
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCourseDto: UpdateCourseDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File; intro_video?: Express.Multer.File },
  ) {
    let cover_image: string | null = null;
    let intro_video: string | null = null;

    try {
      if (updateCourseDto?.beltIds) await this.validateBeltIds(updateCourseDto.beltIds);

      await checkConnection(Services.ACADEMY, this.academyServiceClient);
      const course = await this.findById(id);

      cover_image = files.cover_image ? await this.uploadFile(files.cover_image[0], `academy/course/${id}`) : null;
      intro_video = files.intro_video ? await this.uploadFile(files.intro_video[0], `academy/course/${id}`) : null;

      if (cover_image) updateCourseDto.cover_image = cover_image;
      if (intro_video) updateCourseDto.intro_video = intro_video;

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(CoursePatterns.UPDATE, {
            courseId: id,
            updateCourseDto,
          })
          .pipe(timeout(5000)),
      );

      if (cover_image) await this.removeFile(course.cover_image);
      if (intro_video) await this.removeFile(course.intro_video);

      return handleServiceResponse(data);
    } catch (error) {
      await this.removeFile(cover_image);
      await this.removeFile(intro_video);
      handleError(error, 'Failed to update course', 'CourseService');
    }
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto, @Query() queryCourseDto: QueryCourseDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(CoursePatterns.GET_ALL, { queryCourseDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.academyServiceClient.send(CoursePatterns.GET_ONE, { courseId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get course', 'CoursesService');
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      const course = await this.findById(id);
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.academyServiceClient.send(CoursePatterns.REMOVE, { courseId: id }).pipe(timeout(5000)));

      const folderName = `academy/course/${course.id}`;
      await this.awsService.removeFolder(folderName);

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove course', 'CoursesService');
    }
  }

  private async findById(id: number) {
    const result = await lastValueFrom(this.academyServiceClient.send(CoursePatterns.GET_ONE, { courseId: id }).pipe(timeout(5000)));

    if (result?.error) throw result;

    return result.data;
  }
  private async validateBeltIds(beltIds: number[]) {
    await checkConnection(Services.CLUB, this.clubServiceClient, { pattern: ClubPatterns.CHECK_CONNECTION });

    const result = await lastValueFrom(this.clubServiceClient.send(BeltPatterns.GET_BY_IDS, { beltIds }).pipe(timeout(5000)));

    if (result?.error) throw result;
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
