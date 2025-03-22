import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiParam, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateChaptersDto, QueryChaptersDto, UpdateChaptersDto } from '../../../common/dtos/academy-service/chapter.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { ChapterPatterns } from '../../../common/enums/academy-service/academy.event';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { FileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('chapters')
@ApiTags('Chapters')
@AuthDecorator()
export class ChaptersController {
  constructor(@Inject(Services.ACADEMY) private readonly academyServiceClient: ClientProxy) {}

  @Post()
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createChapterDto: CreateChaptersDto) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(ChapterPatterns.CREATE, {
            createChapterDto: { ...createChapterDto },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create chapter', 'ChaptersService');
    }
  }

  @Get('course/:courseId')
  @ApiParam({ name: 'courseId', type: 'number' })
  getByCourse(@Param('courseId') courseId: number) {
    // return this.chapterService.getByCourse(courseId);
  }

  @Get(':id')
  @ApiParam({ name: 'id', type: 'number' })
  getOne(@Param('id') id: number) {
    // return this.chapterService.getOne(id);
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChaptersDto: UpdateChaptersDto,
    @UploadedFile(new FileValidationPipe(10 * 1024 * 1024, ['image/jpeg', 'image/png']))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(ChapterPatterns.UPDATE, {
            user,
            chapterId: id,
            updateChaptersDto: { ...updateChaptersDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated chapter', 'ChaptersService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryChaptersDto: QueryChaptersDto): Promise<any> {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(ChapterPatterns.GET_ALL, { user, queryChaptersDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(ChapterPatterns.GET_ONE, { user, chapterId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get chapter', 'ChaptersService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(ChapterPatterns.REMOVE, { user, chapterId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove chapter', 'ChaptersService');
    }
  }
}
