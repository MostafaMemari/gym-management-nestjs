import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';
import { ICreateUser } from './interfaces/user.interface';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) { }

  @MessagePattern(UserPatterns.CreateUser)
  create(@Payload() data: ICreateUser){
    return this.userService.create(data)
  }

  @MessagePattern(UserPatterns.CheckConnection)
  checkConnection() {
    return true
  }
}
