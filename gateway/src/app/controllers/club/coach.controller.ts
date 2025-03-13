import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  InternalServerErrorException,
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
import { CreateCoachDto, QueryCoachDto, UpdateCoachDto } from '../../../common/dtos/club-service/coach.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { CoachPatterns } from '../../../common/enums/club.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { UploadFileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('coaches')
@ApiTags('Coaches')
@AuthDecorator()
export class CoachController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async create(
    @GetUser() user: User,
    @Body() createCoachDto: CreateCoachDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(CoachPatterns.CREATE, {
            user,
            createCoachDto: { ...createCoachDto, image },
          })
          .pipe(timeout(10000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create coach', 'CoachService');
    }
  }

  @Put(':id')
  @UseInterceptors(UploadFile('image'))
  @ApiConsumes(SwaggerConsumes.MultipartData)
  async update(
    @GetUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCoachDto: UpdateCoachDto,
    @UploadedFile(new UploadFileValidationPipe(10 * 1024 * 1024, 'image/(png|jpg|jpeg|webp)'))
    image: Express.Multer.File,
  ) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(CoachPatterns.UPDATE, {
            user,
            coachId: id,
            updateCoachDto: { ...updateCoachDto, image },
          })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated coach', 'CoachService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() queryCoachDto: QueryCoachDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(CoachPatterns.GET_ALL, { user, queryCoachDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(CoachPatterns.GET_ONE, { user, coachId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get coach', 'CoachService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.clubServiceClient.send(CoachPatterns.REMOVE, { user, coachId: id }).pipe(timeout(5000)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove coach', 'CoachService');
    }
  }
}
