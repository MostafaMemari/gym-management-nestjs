import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @MessagePattern('get_hello')
  getHello(): string {
    return this.authService.getHello();
  }

  @MessagePattern("check_connection")
  checkConnection() {
    return true
  }
}
