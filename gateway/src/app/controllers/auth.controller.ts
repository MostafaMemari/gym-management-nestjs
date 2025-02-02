import { Body, Controller, Get, HttpException, Inject, InternalServerErrorException, Post } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AuthPatterns } from "../../common/enums/auth.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { SignupDto } from "src/common/dtos/auth.dto";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    constructor(@Inject(Services.AUTH) private readonly authServiceClient: ClientProxy) { }

    async checkConnection(): Promise<boolean> {
        try {
            return await lastValueFrom(
                this.authServiceClient
                    .send(AuthPatterns.CheckConnection, {})
                    .pipe(timeout(5000))
            );
        } catch (error) {
            throw new InternalServerErrorException(AuthPatterns.NotConnected);
        }
    }

    @Post("signup")
    @ApiConsumes('application/json', "application/x-www-form-urlencoded")
    async getHello(@Body() { confirmPassword, ...signupDto }: SignupDto) {
        await this.checkConnection()
        
        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signup, signupDto).pipe(timeout(5000)))
        
 
        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

}