import { Body, Controller, Get, HttpException, Inject, InternalServerErrorException, Logger, Post, UseGuards } from "@nestjs/common";
import { Services } from "../../../common/enums/services.enum";
import { ClientProxy } from "@nestjs/microservices";
import { lastValueFrom, timeout } from "rxjs";
import { ApiConsumes, ApiTags } from "@nestjs/swagger";
import { AuthPatterns } from "../../../common/enums/auth.events";
import { ServiceResponse } from "../../../common/interfaces/serviceResponse.interface";
import { RefreshTokenDto, SigninDto, SignoutDto, SignupDto } from "../../../common/dtos/auth-service/auth.dto";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { SwaggerConsumes } from "../../../common/enums/swagger-consumes.enum";

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
    private readonly timeout = 5000
    private logger: Logger = new Logger(AuthController.name)

    constructor(
        @Inject(Services.AUTH) private readonly authServiceClient: ClientProxy
    ) { }

    async checkConnection(): Promise<void> {
        try {
            this.logger.verbose("Checking connection to auth service.....")
            await lastValueFrom(
                this.authServiceClient
                    .send(AuthPatterns.CheckConnection, {})
                    .pipe(timeout(this.timeout))
            );
            this.logger.log("Auth service is connected.")
        } catch (error) {
            this.logger.error(`Auth service is not responding: ${error.message}`)
            throw new InternalServerErrorException("Auth service is not connected");
        }
    }

    @Post("signup")
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signup(@Body() { confirmPassword, ...signupDto }: SignupDto) {
        this.logger.debug(`Received signup request: username=${signupDto.username}`)
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signup, signupDto).pipe(timeout(this.timeout)))

        if (data.error) {
            this.logger.warn(`Signup failed for: email=${signupDto.username}: ${data.message}`)
            throw new HttpException(data.message, data.status)
        }

        this.logger.log(`User signed up successfully: userId=${data.data?.user?.id}, username=${signupDto.username}`)
        return data
    }

    @Post("signin")
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signin(@Body() signinDto: SigninDto) {
        this.logger.debug(`Received signin request: identifier=${signinDto.identifier}`)
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signin, signinDto).pipe(timeout(this.timeout)))

        if (data.error) {
            this.logger.warn(`Failed signin attempt: identifier=${signinDto.identifier} reason=${data.message}`)
            throw new HttpException(data.message, data.status)
        }

        this.logger.log(`User signed in successfully: userId=${data.data?.user?.id}, message=${data.message}`)
        return data
    }

    @Post("signout")
    @UseGuards(AuthGuard)
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async signout(@Body() signoutDto: SignoutDto) {
        this.logger.debug(`Received signout request`)
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signout, signoutDto).pipe(timeout(this.timeout)))

        if (data.error) {
            this.logger.warn(`Failed signout attempt: reason=${data.message}`)
            throw new HttpException(data.message, data.status)
        }

        this.logger.log(`User signed out successfully: message=${data.message}`)
        return data
    }

    @Post("refreshToken")
    @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
    async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
        this.logger.debug(`Received refresh-token request`)
        await this.checkConnection()

        const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.RefreshToken, refreshTokenDto).pipe(timeout(this.timeout)))

        if (data.error) {
            this.logger.warn(`Failed refresh-token attempt: reason=${data.message}`)
            throw new HttpException(data.message, data.status)
        }

        this.logger.log(`Refreshed token successfully: message=${data.message}`)
        return data
    }

}