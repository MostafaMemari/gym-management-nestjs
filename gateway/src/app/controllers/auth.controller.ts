import { Body, Controller, HttpException, Inject, InternalServerErrorException, Post, UseGuards } from "@nestjs/common";
import { Services } from "../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AuthPatterns } from "../../common/enums/auth.events";
import { ServiceResponse } from "../../common/interfaces/serviceResponse.interface";
import { RefreshTokenDto, SigninDto, SignoutDto, SignupDto } from "../../common/dtos/auth.dto";
import { AuthGuard } from "../../common/guards/auth.guard";
import { SwaggerConsumes } from "../../common/enums/swagger-consumes.enum";

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
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signup(@Body() { confirmPassword, ...signupDto }: SignupDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signup, signupDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("signin")
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signin(@Body() signinDto: SigninDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signin, signinDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("signout")
    @UseGuards(AuthGuard)
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signout(@Body() signoutDto: SignoutDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signout, signoutDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

    @Post("refreshToken")
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.RefreshToken, refreshTokenDto).pipe(timeout(this.timeout)))

        if (data.error)
            throw new HttpException(data.message, data.status)

        return data
    }

}