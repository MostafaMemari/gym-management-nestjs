import { Body, Controller, Get, HttpException, Inject, InternalServerErrorException, Post, UseGuards } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AuthPatterns } from "../../common/enums/auth.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { RefreshTokenDto, SigninDto, SignoutDto, SignupDto } from "../../common/dtos/auth.dto";
import { AuthGuard } from "src/common/guards/auth.guard";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    private readonly timeout = 5000

    constructor(@Inject(Services.AUTH) private readonly authServiceClient: ClientProxy) { }

    async checkConnection(): Promise<boolean> {
        try {
            return await lastValueFrom(
                this.authServiceClient
                    .send(AuthPatterns.CheckConnection, {})
                    .pipe(timeout(this.timeout))
            );
        } catch (error) {
            throw new InternalServerErrorException("Auth service is not connected");
        }
    }

    @Post("signup")
    @ApiConsumes('application/json', "application/x-www-form-urlencoded")
    async signup(@Body() { confirmPassword, ...signupDto }: SignupDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signup, signupDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("signin")
    @ApiConsumes('application/json', "application/x-www-form-urlencoded")
    async signin(@Body() signinDto: SigninDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signin, signinDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("signout")
    @ApiConsumes('application/json', "application/x-www-form-urlencoded")
    async signout(@Body() signoutDto: SignoutDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signout, signoutDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("refreshToken")
    @ApiConsumes('application/json', "application/x-www-form-urlencoded")
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        await this.checkConnection()
        
        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.RefreshToken, refreshTokenDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

}