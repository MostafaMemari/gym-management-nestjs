import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern(UserPatterns.getHello)
  getHello(): string {
    return this.userService.getHello();
  }

  @MessagePattern(UserPatterns.checkConnection)
  checkConnection() {
    return true
  }
}
