import { Controller, Get, HttpException, Inject, InternalServerErrorException } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiTags } from "@nestjs/swagger";
import { AuthPatterns } from "../../common/enums/auth.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(@Inject(Services.AUTH) private readonly authServiceClient: ClientProxy) { }

    async checkConnection(): Promise<boolean> {
        try {
            return await lastValueFrom(
                this.authServiceClient
                    .send(AuthPatterns.checkConnection, {})
                    .pipe(timeout(5000))
            );
        } catch (error) {
            throw new InternalServerErrorException(
                "Auth service is not connected"
            );
        }
    }

    @Get("hello")
    async getHello() {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.getHello, {}).pipe(timeout(5000)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

}