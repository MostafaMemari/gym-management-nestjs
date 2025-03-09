import { Body, Controller, Delete, Get, Inject, InternalServerErrorException, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { lastValueFrom, timeout } from 'rxjs';

import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { PaginationDto } from '../../../common/dtos/shared.dto';
import { Services } from '../../../common/enums/services.enum';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '../../../common/enums/role.enum';
import { SessionPatterns } from '../../../common/enums/club.events';
import { CreateSessionDto, QuerySessionDto, UpdateSessionDto } from '../../../common/dtos/club-service/session.dto';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '../../../common/interfaces/user.interface';

@Controller('sessions')
@ApiTags('Sessions')
@AuthDecorator()
export class SessionController {
  constructor(@Inject(Services.CLUB) private readonly sessionServiceClient: ClientProxy) {}

  private async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.sessionServiceClient.send(SessionPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('Session service is not connected');
    }
  }

  @Post()
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async create(@GetUser() user: User, @Body() createSessionDto: CreateSessionDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.sessionServiceClient.send(SessionPatterns.CreateSession, { user, createSessionDto: { ...createSessionDto } }).pipe(timeout(10000)),
      );
      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to create session', 'SessionService');
    }
  }

  @Put(':id')
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.UrlEncoded, SwaggerConsumes.Json)
  async update(@GetUser() user: User, @Param('id', ParseIntPipe) id: number, @Body() updateSessionDto: UpdateSessionDto) {
    try {
      await this.checkConnection();
      const data: ServiceResponse = await lastValueFrom(
        this.sessionServiceClient
          .send(SessionPatterns.UpdateSession, { user, sessionId: id, updateSessionDto: { ...updateSessionDto } })
          .pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to updated session', 'SessionService');
    }
  }

  @Get()
  @Roles(Role.ADMIN_CLUB)
  async findAll(@GetUser() user: User, @Query() paginationDto: PaginationDto, @Query() querySessionDto: QuerySessionDto): Promise<any> {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.sessionServiceClient.send(SessionPatterns.GetSessions, { user, querySessionDto, paginationDto }).pipe(timeout(5000)),
      );
      return handleServiceResponse(data);
    } catch (error) {}
  }

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  async findOne(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.sessionServiceClient.send(SessionPatterns.GetSession, { user, sessionId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get session', 'SessionService');
    }
  }

  @Delete(':id')
  @Roles(Role.ADMIN_CLUB)
  async remove(@GetUser() user: User, @Param('id', ParseIntPipe) id: number) {
    try {
      await this.checkConnection();

      const data: ServiceResponse = await lastValueFrom(
        this.sessionServiceClient.send(SessionPatterns.RemoveSession, { user, sessionId: id }).pipe(timeout(5000)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to remove session', 'SessionService');
    }
  }
}
