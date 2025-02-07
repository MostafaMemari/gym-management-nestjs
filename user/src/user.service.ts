import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { UserMessages } from './common/enums/user.messages';
import { IPagination } from './common/interfaces/user.interface';
import { pagination } from './common/utils/pagination.utils';
import { Services } from './common/enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { RedisPatterns } from './common/enums/redis.events';

@Injectable()
export class UserService {

  private readonly timeout = 4500

  constructor(
    @Inject(Services.REDIS) private readonly redisServiceClientProxy: ClientProxy,
    private readonly prisma: PrismaService
  ) { }

  async redisCheckConnection(): Promise<void | ServiceResponse> {
    try {
      await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      return {
        data: {},
        error: true,
        message: 'Redis service is not connected',
        status: HttpStatus.INTERNAL_SERVER_ERROR
      }
    }
  }

  async isExistingUser(userDto: Prisma.UserCreateInput) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          {
            email: userDto.email,
          },
          {
            mobile: userDto.mobile
          },
          {
            username: userDto.username
          }
        ]
      }
    })


    if (user) return true

    return false
  }

  async create(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    const existingUser = await this.isExistingUser(userDto)

    if (existingUser) {
      return {
        data: {},
        error: true,
        message: UserMessages.AlreadyExistsUser,
        status: HttpStatus.CONFLICT,
      };
    }

    const isFirstUser = (await this.prisma.user.count()) == 0;

    const user = await this.prisma.user.create({
      data: {
        ...userDto,
        role: isFirstUser ? Role.SUPER_ADMIN : Role.STUDENT
      },
      omit: { password: true }
    })


    return {
      data: { user },
      error: false,
      message: UserMessages.CreatedUser,
      status: HttpStatus.CREATED,
    };
  }

  async createUserStudent(userStudentDot: Prisma.UserCreateInput): Promise<ServiceResponse> {
    const { username, role } = userStudentDot;

    const existingUser = await this.prisma.user.findFirst({
      where: {
        username,
      },
    });

    if (existingUser) {
      return {
        data: {},
        error: true,
        message: UserMessages.AlreadyExistsUserWithUsername,
        status: HttpStatus.CONFLICT,
      };
    }

    const newUser = await this.prisma.user.create({ data: { username, role: role || Role.STUDENT } });

    return {
      data: { user: newUser },
      error: false,
      message: UserMessages.CreatedUser,
      status: HttpStatus.CREATED,
    };
  }

  async findAll(paginationDto?: IPagination): Promise<ServiceResponse> {
    const isConnected = await this.redisCheckConnection()

    if (typeof isConnected == 'object' && isConnected.error) return isConnected

    const cacheKey = 'users_cache'

    const usersCache = await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Get, { key: cacheKey }).pipe(timeout(this.timeout)))

    if (!usersCache.error && usersCache.status == HttpStatus.OK) {
      return {
        data: { ...pagination(paginationDto, JSON.parse(usersCache.data.value)) },
        error: false,
        message: "",
        status: HttpStatus.OK
      }
    }

    const userExtraQuery: Prisma.UserFindManyArgs = {
      orderBy: { createdAt: `desc` },
      omit: { password: true }
    }

    const users = await this.prisma.user.findMany(userExtraQuery)

    const redisKeys = {
      key: cacheKey,
      value: JSON.stringify(users),
      expireTime: 30 //* Seconds
    }

    await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Set, redisKeys).pipe(timeout(this.timeout)))

    return {
      data: { ...pagination(paginationDto, users) },
      error: false,
      message: '',
      status: HttpStatus.OK,
    };
  }

  async findById(userDto: { userId: number }): Promise<ServiceResponse> {
    const user = await this.prisma.user.findFirst({
      where: { id: userDto.userId },
      omit: { password: true },
    });

    if (!user) {
      return {
        data: {},
        error: true,
        message: UserMessages.NotFoundUser,
        status: HttpStatus.NOT_FOUND,
      };
    }

    return {
      data: { user },
      error: false,
      message: '',
      status: HttpStatus.OK,
    };
  }

  async findByIdentifier({ identifier }: { identifier: string }): Promise<ServiceResponse> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { mobile: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      return {
        data: {},
        error: true,
        message: UserMessages.NotFoundUser,
        status: HttpStatus.NOT_FOUND,
      };
    }

    return {
      data: { user },
      error: false,
      message: '',
      status: HttpStatus.OK,
    };
  }

  async removeUserById(userDto: { userId: number }): Promise<ServiceResponse> {
    const existingUser = await this.prisma.user.findFirst({ where: { id: userDto.userId } });

    if (!existingUser) {
      return {
        data: {},
        error: true,
        message: UserMessages.NotFoundUser,
        status: HttpStatus.CONFLICT,
      };
    }

    const removedUser = await this.prisma.user.delete({ where: { id: userDto.userId }, omit: { password: true } });

    return {
      data: { removedUser },
      error: false,
      message: UserMessages.RemovedUserSuccess,
      status: HttpStatus.OK,
    };
  }

  async findOrCreate(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    const existingUser = await this.isExistingUser(userDto)

    if (existingUser) {
      return {
        data: { user: existingUser },
        error: false,
        message: "",
        status: HttpStatus.OK
      }
    }

    return await this.create(userDto)
  }

}
