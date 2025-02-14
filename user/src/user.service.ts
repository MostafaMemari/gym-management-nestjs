import { ConflictException, HttpStatus, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { Prisma, Role } from '@prisma/client';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { UserMessages } from './common/enums/user.messages';
import { IPagination, ISearchUser } from './common/interfaces/user.interface';
import { pagination } from './common/utils/pagination.utils';
import { Services } from './common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { RedisPatterns } from './common/enums/redis.events';
import { UserRepository } from './user.repository';

@Injectable()
export class UserService {

  private readonly timeout = 4500

  constructor(
    @Inject(Services.REDIS) private readonly redisServiceClientProxy: ClientProxy,
    private readonly userRepository: UserRepository
  ) { }

  async redisCheckConnection(): Promise<void | never> {
    try {
      await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      throw new RpcException({ message: "User service is not connected", status: error.status })
    }
  }

  async create(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {

      const existingUser = await this.userRepository.isExistingUser(userDto)

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUser)
      }

      const isFirstUser = (await this.userRepository.count()) == 0;

      const user = await this.userRepository.create({
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
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async createUserStudent(userStudentDot: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {

      const { username, role } = userStudentDot;

      const existingUser = await this.userRepository.findOneByUsername(username)

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername)
      }

      const newUser = await this.userRepository.create({
        data: { username, role: role || Role.STUDENT },
        omit: { password: true }
      });

      return {
        data: { user: newUser },
        error: false,
        message: UserMessages.CreatedUser,
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async findAll(paginationDto?: IPagination): Promise<ServiceResponse> {
    try {
      await this.redisCheckConnection()

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

      const users = await this.userRepository.findAll(userExtraQuery)

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
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async findById(userDto: { userId: number }): Promise<ServiceResponse> {
    try {
      const user = await this.userRepository.findById(userDto.userId, { omit: { password: true } })

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser)
      }

      return {
        data: { user },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async findByIdentifier({ identifier }: { identifier: string }): Promise<ServiceResponse> {
    try {
      const user = await this.userRepository.findOneByIdentifier(identifier)

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser)
      }

      return {
        data: { user },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async removeUserById(userDto: { userId: number }): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.findById(userDto.userId, { omit: { password: true } })

      if (!existingUser) {
        throw new NotFoundException(UserMessages.NotFoundUser)
      }

      const removedUser = await this.userRepository.delete(userDto.userId, { omit: { password: true } })

      return {
        data: { removedUser },
        error: false,
        message: UserMessages.RemovedUserSuccess,
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async findOrCreate(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto)

      if (existingUser) {
        return {
          data: { user: existingUser },
          error: false,
          message: "",
          status: HttpStatus.OK
        }
      }

      return await this.create(userDto)
    } catch (error) {
      throw new RpcException(error)
    }

  }

  async search({ query, ...paginationDto }: ISearchUser): Promise<ServiceResponse> {
    try {
      await this.redisCheckConnection()

      const cacheKey = `searchUser_${query}`

      const cacheUsers: ServiceResponse = await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Get, { key: cacheKey }).pipe(timeout(this.timeout)))

      if (!cacheUsers.error && cacheUsers.status == HttpStatus.OK) {
        return {
          data: { ...pagination(paginationDto, JSON.parse(cacheUsers.data.value)) },
          error: false,
          message: "",
          status: HttpStatus.OK
        }
      }

      const userExtraQuery: Prisma.UserFindManyArgs = {
        omit: { password: true },
        orderBy: { createdAt: "desc" },
        where: {
          OR: [
            {
              username: { contains: query, mode: "insensitive" }

            },
            {
              mobile: { contains: query, mode: "insensitive" }
            }
          ]
        }
      }

      const users = await this.userRepository.findAll(userExtraQuery)

      const redisKeys = {
        key: cacheKey,
        value: JSON.stringify(users),
        expireTime: 30 //* Seconds
      }

      await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Set, redisKeys).pipe(timeout(this.timeout)))


      return {
        data: { ...pagination(paginationDto, users) },
        error: false,
        message: "",
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error)
    }
  }

}
