import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { CreateSessionDto, QuerySessionDto, UpdateSessionDto } from '../../../common/dtos/club-service/session.dto';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { SessionPatterns } from '../../../common/enums/club-service/gym.events';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { User } from '../../../common/interfaces/user.interface';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';

@Controller('sessions')
@ApiTags('Sessions')
@AuthDecorator()
export class SessionController {
  constructor(@Inject(Services.CLUB) private readonly clubServiceClient: ClientProxy) {}

  @Post()
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createSessionDto: CreateSessionDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(SessionPatterns.CREATE, { user, createSessionDto: { ...createSessionDto } }).pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create session', 'SessionService');
    }
  }

  @Put(':id')
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateSessionDto: UpdateSessionDto) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(SessionPatterns.UPDATE, { user, sessionId: id, updateSessionDto: { ...updateSessionDto } }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated session', 'SessionService');
    }
  }

  @Get()
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() querySessionDto: QuerySessionDto): Promise<any> {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(SessionPatterns.GET_ALL, { user, querySessionDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(SessionPatterns.GET_ONE, { user, sessionId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get session', 'SessionService');
    }
  }

  @Delete(':id')
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.CLUB, this.clubServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.clubServiceClient.send(SessionPatterns.REMOVE, { user, sessionId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove session', 'SessionService');
    }
  }
}
