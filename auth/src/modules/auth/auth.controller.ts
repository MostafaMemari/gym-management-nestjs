import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthPatterns } from '../../common/enums/auth.events';
import { IForgetPassword, IResetPassword, ISignin, ISignup, IVerifyOtp } from '../../common/interfaces/auth.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @MessagePattern(AuthPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(AuthPatterns.Signup)
  signup(@Payload() data: ISignup) {
    return this.authService.signup(data);
  }

  @MessagePattern(AuthPatterns.Signin)
  signin(@Payload() data: ISignin) {
    return this.authService.signin(data);
  }

  @MessagePattern(AuthPatterns.SigninStudent)
  signinStudent(@Payload() data: { nationalCode: string }) {
    return this.authService.signinStudent(data);
  }

  @MessagePattern(AuthPatterns.SigninCoach)
  signinCoach(@Payload() data: { nationalCode: string }) {
    return this.authService.signinCoach(data);
  }

  @MessagePattern(AuthPatterns.Signout)
  signout(@Payload() data: { refreshToken: string }) {
    return this.authService.signout(data);
  }

  @MessagePattern(AuthPatterns.VerifyAccessToken)
  verifyAccessToken(@Payload() data: { accessToken: string }) {
    return this.authService.verifyAccessToken(data);
  }

  @MessagePattern(AuthPatterns.RefreshToken)
  refreshToken(@Payload() data: { refreshToken: string }) {
    return this.authService.refreshToken(data);
  }

  @MessagePattern(AuthPatterns.ForgetPassword)
  forgetPassword(@Payload() data: IForgetPassword) {
    return this.authService.forgetPassword(data);
  }

  @MessagePattern(AuthPatterns.ResetPassword)
  resetPassword(@Payload() data: IResetPassword) {
    return this.authService.resetPassword(data);
  }

  @MessagePattern(AuthPatterns.VerifyOtp)
  verifyOtp(@Payload() data: IVerifyOtp) {
    return this.authService.verifyOtp(data);
  }
}
