import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthPatterns } from './enums/auth.events';
import { ISignin, ISignup } from './interfaces/auth.interface';

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

  @MessagePattern(AuthPatterns.Signout)
  signout(@Payload() data: { refreshToken: string }) {
    return this.authService.signout(data);
  }
}
