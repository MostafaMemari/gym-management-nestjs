import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';
import { AuthPatterns } from './enums/auth.events';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern(AuthPatterns.getHello)
  getHello(): string {
    return this.authService.getHello();
  }

  @MessagePattern(AuthPatterns.checkConnection)
  checkConnection() {
    return true
  }
}
