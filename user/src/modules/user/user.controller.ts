import { Controller } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UserPatterns } from '../../common/enums/user.events';
import {
  IChangeRole,
  ICreateUser,
  ICreateUserCoach,
  ICreateUserStudent,
  IGetUserByArgs,
  IPagination,
  ISearchUser,
  IUpdateUser,
} from '../../common/interfaces/user.interface';

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
  getAll(@Payload() data?: IPagination) {
    return this.userService.findAll(data);
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

  @MessagePattern(UserPatterns.CreateUserCoach)
  createUserCoach(@Payload() data: ICreateUserCoach) {
    return this.userService.createUserCoach(data);
  }

  @MessagePattern(UserPatterns.RemoveUser)
  removeById(@Payload() data: { userId: number }) {
    return this.userService.removeUserById(data);
  }

  @MessagePattern(UserPatterns.FindOrCreate)
  findOrCreate(@Payload() data: ICreateUser) {
    return this.userService.findOrCreate(data);
  }

  @MessagePattern(UserPatterns.GetUserByMobile)
  getByMobile(@Payload() data: { mobile: string }) {
    return this.userService.findByMobile(data);
  }

  @MessagePattern(UserPatterns.SearchUser)
  search(@Payload() data: ISearchUser) {
    return this.userService.search(data);
  }

  @MessagePattern(UserPatterns.ChangeUserRole)
  changeRole(@Payload() data: IChangeRole) {
    return this.userService.changeRole(data);
  }

  @MessagePattern(UserPatterns.UpdateUser)
  update(@Payload() data: IUpdateUser) {
    return this.userService.update(data);
  }

  @MessagePattern(UserPatterns.GetUserByArgs)
  getOneByArgs(@Payload() data: IGetUserByArgs) {
    return this.userService.findByArgs(data);
  }
}
