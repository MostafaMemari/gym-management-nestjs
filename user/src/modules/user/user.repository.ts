import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';
import { UserMessages } from '../../common/enums/user.messages';
import { IGetUserByArgs } from '../../common/interfaces/user.interface';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(args: Prisma.UserFindManyArgs = {}): Promise<User[]> {
    return this.prisma.user.findMany({ ...args });
  }

  findById(id: number, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { id }, ...args, include: { roles: { include: { permissions: true } } } });
  }

  findOne(args: Prisma.UserFindFirstArgs): Promise<User | null> {
    return this.prisma.user.findFirst({ ...args });
  }

  create(args: Prisma.UserCreateArgs): Promise<User> {
    return this.prisma.user.create(args);
  }

  update(id: number, args: Omit<Prisma.UserUpdateArgs, 'where'>): Promise<User> {
    return this.prisma.user.update({ where: { id }, ...args, include: { roles: { include: { permissions: true } } } });
  }

  delete(id: number, args: Omit<Prisma.UserDeleteArgs, 'where'> = {}): Promise<User | null> {
    return this.prisma.user.delete({ where: { id }, ...args, include: { roles: { include: { permissions: true } } } });
  }

  async isExistingUser(userDto: Prisma.UserCreateInput): Promise<User | boolean> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            mobile: userDto.mobile,
          },
          {
            username: userDto.username,
          },
        ],
      },
      include: { roles: { include: { permissions: true } } },
    });

    if (user) return user;

    return false;
  }

  count(): Promise<number> {
    return this.prisma.user.count();
  }

  findOneByUsername(username: string, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
    return this.prisma.user.findFirst({ where: { username }, ...args, include: { roles: { include: { permissions: true } } } });
  }

  findOneByIdentifier(identifier: string, args: Prisma.UserFindFirstArgs = {}): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [
          {
            username: identifier,
          },
          {
            mobile: identifier,
          },
        ],
      },
      ...args,
      include: { roles: { include: { permissions: true } } },
    });
  }

  async findByIdAndThrow(userId: number): Promise<User> {
    const user = await this.prisma.user.findFirst({ where: { id: userId }, include: { roles: { include: { permissions: true } } } });

    if (!user) {
      throw new NotFoundException(UserMessages.NotFoundUser);
    }

    return user;
  }

  async findByArgs(data: IGetUserByArgs = {}): Promise<User> {
    return this.prisma.user.findFirst({
      where: { OR: [{ username: data.username }, { mobile: data.mobile }] },
      include: { roles: { include: { permissions: true } } },
    });
  }

  deleteMany(ids: number[]): Promise<Prisma.BatchPayload> {
    return this.prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
}
