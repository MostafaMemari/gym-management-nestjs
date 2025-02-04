import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { ServiceResponse } from './interfaces/serviceResponse.interface';
import { UserMessages } from './enums/user.messages';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) { }

  async create(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {

    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: userDto.email
          },
          {
            mobile: userDto.mobile
          }
        ]
      }
    })

    if (existingUser) {
      return {
        data: {},
        error: true,
        message: UserMessages.AlreadyExistsUser,
        status: HttpStatus.CONFLICT
      }
    }

    const isFirstUser = await this.prisma.user.count() == 0

    const user = await this.prisma.user.create({
      data: {
        ...userDto,
        role: isFirstUser ? Role.SUPER_ADMIN : Role.STUDENT
      }
    })


    return {
      data: { user },
      error: false,
      message: UserMessages.CreatedUser,
      status: HttpStatus.CREATED
    }
  }

  async createUserStudent(userStudentDot: Prisma.UserCreateInput): Promise<ServiceResponse> {
    const { username, role } = userStudentDot

    const existingUser = await this.prisma.user.findFirst({
      where: {
        username
      }
    })

    if (existingUser) {
      return {
        data: {},
        error: true,
        message: UserMessages.AlreadyExistsUserWithUsername,
        status: HttpStatus.CONFLICT
      }
    }

    const newUser = await this.prisma.user.create({ data: { username, role: role || Role.STUDENT } })

    return {
      data: { user: newUser },
      error: false,
      message: UserMessages.CreatedUser,
      status: HttpStatus.CREATED
    }
  }

  async findAll(): Promise<ServiceResponse> {
    const users = await this.prisma.user.findMany({ omit: { password: true } })

    return {
      data: { users },
      error: false,
      message: "",
      status: HttpStatus.OK
    }
  }

  async findById(userDto: { userId: number }): Promise<ServiceResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userDto.userId },
      omit: { password: true }
    })

    if (!user) {
      return {
        data: {},
        error: true,
        message: UserMessages.NotFoundUser,
        status: HttpStatus.NOT_FOUND
      }
    }

    return {
      data: { user },
      error: false,
      message: "",
      status: HttpStatus.OK
    }

  }


  async findByIdentifier({ identifier }: { identifier: string }): Promise<ServiceResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { mobile: identifier }
        ]
      }
    })

    if (!user) {
      return {
        data: {},
        error: true,
        message: UserMessages.NotFoundUser,
        status: HttpStatus.NOT_FOUND
      }
    }

    return {
      data: { user },
      error: false,
      message: "",
      status: HttpStatus.OK
    }
  }

}
