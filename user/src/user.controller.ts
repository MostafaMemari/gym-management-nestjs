import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';
import { ICreateUser, ICreateUserStudent } from './interfaces/user.interface';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(UserPatterns.CheckConnection)
  checkConnection() {
    return true;
  }

  @MessagePattern(UserPatterns.CreateUser)
  create(@Payload() data: ICreateUser) {
    return this.userService.create(data);
  }

  @MessagePattern(UserPatterns.GetUsers)
  getAll() {
    return this.userService.findAll();
  }

  @MessagePattern(UserPatterns.GetUserById)
  getById(@Payload() data: { userId: number }) {
    return this.userService.findById(data);
  }

  @MessagePattern(UserPatterns.GetUserByIdentifier)
  getByIdentifier(@Payload() data: { identifier: string }) {
    return this.userService.findByIdentifier(data);
  }

  @MessagePattern(UserPatterns.CreateUserStudent)
  createUserStudent(@Payload() data: ICreateUserStudent) {
    return this.userService.createUserStudent(data);
  }

  @MessagePattern(UserPatterns.RemoveUser)
  removeById(@Payload() data: { userId: number }) {
    return this.userService.removeUserById(data);
  }
}
