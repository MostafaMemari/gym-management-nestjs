import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class UserService {

  constructor(private readonly prisma: PrismaService) { }

  create(userDto: Prisma.UserCreateInput) {
    return this.prisma.user.create({ data: userDto })
  }

}
