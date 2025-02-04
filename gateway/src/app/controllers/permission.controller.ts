import { Controller, Get, HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiTags } from "@nestjs/swagger";
import { PermissionPatterns } from "../../common/enums/permission.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";

@Controller("permission")
@ApiTags("Permission")
export class PermissionController {
  constructor(@Inject(Services.PERMISSION) private readonly permissionServiceClient: ClientProxy) {}

  async checkConnection(): Promise<boolean> {
    try {
      return await lastValueFrom(this.permissionServiceClient.send(PermissionPatterns.checkConnection, {}).pipe(timeout(5000)));
    } catch (error) {
      throw new InternalServerErrorException("Permission service is not connected");
    }
  }

  @Get("hello")
  async getHello() {
    await this.checkConnection();

    const data: ServiceResponse = await lastValueFrom(
      this.permissionServiceClient.send(PermissionPatterns.getHello, {}).pipe(timeout(5000))
    );

    if (data.error) throw new HttpException(data.message, data.status);

    return data;
  }
}
