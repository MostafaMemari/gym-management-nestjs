import { Controller, Inject, InternalServerErrorException } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";

@Controller('auth')
export class AuthController {
    constructor(@Inject(Services.AUTH) private readonly authServiceClient: ClientProxy) { }

    checkConnection(): Promise<boolean> {
        try {
            return lastValueFrom(
                this.authServiceClient
                    .send("check-connection", {})
                    .pipe(timeout(5000))
            );
        } catch (error) {
            throw new InternalServerErrorException(
                "Auth service is not connected"
            );
        }
    }

}