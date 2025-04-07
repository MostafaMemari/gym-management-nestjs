import { Body, Controller, Delete, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
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
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AwsService } from '../../../modules/s3AWS/s3AWS.service';
import { AccessRole } from '../../../common/decorators/accessRole.decorator';
import { Role } from '../../../common/enums/role.enum';
import { Roles } from '../../../common/decorators/role.decorator';

@Controller('chapters')
@ApiTags('Chapters')
@AuthDecorator()
export class ChaptersController {
  constructor(
    @Inject(Services.ACADEMY) private readonly academyServiceClient: ClientProxy,
    private readonly awsService: AwsService,
  ) {}

  @Post('/course/:courseId')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@Body() createChapterDto: CreateChaptersDto, @Param('courseId', ParseIntPipe) courseId: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(ChapterPatterns.CREATE, {
            courseId,
            createChapterDto: { ...createChapterDto },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create chapter', 'ChaptersService');
    }
  }

  @Put(':id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateChapterDto: UpdateChaptersDto) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient
          .send(ChapterPatterns.UPDATE, {
            chapterId: id,
            updateChapterDto: { ...updateChapterDto },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated chapter', 'ChaptersService');
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
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
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(ChapterPatterns.GET_ONE, { chapterId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get chapter', 'ChaptersService');
    }
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.ACADEMY, this.academyServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.academyServiceClient.send(ChapterPatterns.REMOVE, { chapterId: id }).pipe(timeout(5000)),
      );

      if (!data.error) {
        const chapter = data.data;

        const folderName = `academy/course/${chapter.courseId}/chapter/${chapter.id}`;
        await this.awsService.removeFolder(folderName);
      }

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove chapter', 'ChaptersService');
    }
  }
}
