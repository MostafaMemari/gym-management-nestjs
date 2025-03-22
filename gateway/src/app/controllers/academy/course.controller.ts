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

@Controller('courses')
@ApiTags('Courses')
@AuthDecorator()
export class CoursesController {
  constructor(
    @Inject(Services.ACADEMY) private readonly coursesServiceClient: ClientProxy,
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
    @GetUser() user: User,
    @Body() createCourseDto: CreateCourseDto,
    @UploadedFiles() files: { cover_image?: Express.Multer.File; intro_video?: Express.Multer.File },
  ) {
    let image_cover_key: string | null = null;
    let intro_video_key: string | null = null;

    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      image_cover_key = files.cover_image ? await this.uploadFile(files.cover_image[0], 'academy/image_cover') : null;
      intro_video_key = files.intro_video ? await this.uploadFile(files.intro_video[0], 'academy/intro_video') : null;

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient
          .send(CoursePatterns.CREATE, {
            user,
            createCourseDto: { ...createCourseDto, image_cover_key, intro_video_key },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      await this.removeFile(image_cover_key);
      await this.removeFile(intro_video_key);
      console.log(error.message);
      handleError(error, 'Failed to create lesson', 'CourseService');
    }
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoursesDto: UpdateCourseDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient
          .send(CoursePatterns.UPDATE, {
            user,
            courseId: id,
            updateCoursesDto: { ...updateCoursesDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated course', 'CoursesService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryCoursesDto: QueryCourseDto): Promise<any> {
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
        this.coursesServiceClient.send(CoursePatterns.GET_ONE, { user, courseId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get course', 'CoursesService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.coursesServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.coursesServiceClient.send(CoursePatterns.REMOVE, { user, courseId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove course', 'CoursesService');
    }
  }

  private async uploadFile(file: Express.Multer.File, folderName: string): Promise<string | undefined> {
    if (!file) return;

    const uploadedFile = await this.awsService.uploadSingleFile({ file, folderName });
    return uploadedFile.key;
  }

  private async removeFile(fileKey: string): Promise<void> {
    if (!fileKey) return;
    await this.awsService.deleteFile(fileKey);
  }
}
