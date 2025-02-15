import { Controller, Get, HttpException, Inject, InternalServerErrorException, Param, ParseIntPipe, Query } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiTags } from "@nestjs/swagger";
import { UserPatterns } from "../../common/enums/user.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { PaginationDto, SearchDto } from "../../common/dtos/shared.dto";

@Controller('user')
@ApiTags('User')
export class UserController {
  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) { }

  async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.userServiceClient.send(UserPatterns.CheckConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException('User service is not connected');
    }
  }

  @Get()
  async getUsers(@Query() paginationDto: PaginationDto) {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.userServiceClient.send(UserPatterns.GetUsers, { ...paginationDto }).pipe(timeout(5000)),
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }

  @Get('search')
  async searchUser(@Query() searchDto: SearchDto) {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.userServiceClient.send(UserPatterns.SearchUser, { ...searchDto }).pipe(timeout(5000)),
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.userServiceClient.send(UserPatterns.GetUserById, { userId: id }).pipe(timeout(5000)),
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }
}
