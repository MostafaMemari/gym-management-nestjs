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
import { User } from '../../../common/interfaces/user.interface';
import { CoachPatterns } from '../../../common/enums/club.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { UploadFile } from '../../../common/interceptors/upload-file.interceptor';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { UploadFileValidationPipe } from '../../../common/pipes/upload-file.pipe';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('coaches')
@ApiTags('Coaches')
@AuthDecorator()
export class CoachController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.clubServiceClient.send(CoachPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Coach service is not connected');
    }
  }

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
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(CoachPatterns.CreateCoach, {
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
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient
          .send(CoachPatterns.UpdateCoach, {
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
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(CoachPatterns.GetCoaches, { user, queryCoachDto, paginationDto }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(CoachPatterns.GetCoach, { user, coachId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get coach', 'CoachService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(CoachPatterns.RemoveUserCoach, { user, coachId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove coach', 'CoachService');
    }
  }
}
