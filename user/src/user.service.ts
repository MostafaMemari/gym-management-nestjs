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
      data: { ...user },
      error: false,
      message: UserMessages.CreatedUser,
      status: HttpStatus.CREATED
    }
  }

}
