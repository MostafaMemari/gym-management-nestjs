import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { AuthPatterns } from './enums/auth.events';
import { ISignup } from './interfaces/auth.interface';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern(AuthPatterns.CheckConnection)
  checkConnection() {
    return true
  }

  @MessagePattern(AuthPatterns.Signup)
  signup(@Payload() data: ISignup) {
    return this.authService.signup(data);
  }

}
