import { Body, Controller, Inject, Post } from '@nestjs/common';
import { Services } from '../../../common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { AuthPatterns } from '../../../common/enums/auth.events';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import {
  ForgetPasswordDto,
  RefreshTokenDto,
  RestPasswordDto,
  SigninCoachDto,
  SigninDto,
  SigninStudentDto,
  SignoutDto,
  SignupDto,
  VerifyOtpDto,
} from '../../../common/dtos/auth-service/auth.dto';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  private readonly timeout = 5000;

  constructor(@Inject(Services.AUTH) private readonly authServiceClient: ClientProxy) {}

  @Post('signup')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async signup(@Body() { confirmPassword, ...signupDto }: SignupDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signup, signupDto).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to signup', 'AuthService');
    }
  }

  @Post('signin')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async signin(@Body() signinDto: SigninDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signin, signinDto).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to signin', 'AuthService');
    }
  }

  @Post('signin-student')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async signinStudent(@Body() signinStudentDto: SigninStudentDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClient.send(AuthPatterns.SigninStudent, signinStudentDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to signin student', 'AuthService');
    }
  }

  @Post('signin-coach')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async signinCoach(@Body() signinCoachDto: SigninCoachDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);
      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClient.send(AuthPatterns.SigninCoach, signinCoachDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to signin coach', 'AuthService');
    }
  }

  @Post('signout')
  @AuthDecorator()
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async signout(@Body() signoutDto: SignoutDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);
      const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send(AuthPatterns.Signout, signoutDto).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to signout', 'AuthService');
    }
  }

  @Post('refresh-token')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClient.send(AuthPatterns.RefreshToken, refreshTokenDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to refreshToken', 'AuthService');
    }
  }

  @Post('forget-password')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async forgetPassword(@Body() { mobile }: ForgetPasswordDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClient.send(AuthPatterns.ForgetPassword, { mobile }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to forget-password', 'AuthService');
    }
  }

  @Post('reset-password')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async resetPassword(@Body() restPasswordDto: RestPasswordDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(
        this.authServiceClient.send(AuthPatterns.ResetPassword, restPasswordDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to reset-password', 'AuthService');
    }
  }

  @Post('verify-otp')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    try {
      await checkConnection(Services.AUTH, this.authServiceClient);

      const data: ServiceResponse = await lastValueFrom(this.authServiceClient.send('verify_otp', verifyOtpDto).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to verify-otp', 'AuthService');
    }
  }
}
