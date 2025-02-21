import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { UserMessages } from './common/enums/user.messages';
import { IPagination, ISearchUser } from './common/interfaces/user.interface';
import { pagination } from './common/utils/pagination.utils';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from './user.repository';
// import { LoggerService } from 'nest-logger-plus';
import { CacheService } from './cache/cache.service';
import { CacheKeys, CachePatterns } from './common/enums/cache.enum';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    // private readonly logger: LoggerService,
    private readonly cache: CacheService,
  ) {}

  async create(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUser);
      }

      const isFirstUser = (await this.userRepository.count()) == 0;

      const user = await this.userRepository.create({
        data: {
          ...userDto,
          role: isFirstUser ? Role.SUPER_ADMIN : Role.STUDENT,
        },
        omit: { password: true },
      });

      await this.clearUsersCache();

      return {
        data: { user },
        error: false,
        message: UserMessages.CreatedUser,
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createUserStudent(userStudentDot: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const { username, role } = userStudentDot;

      const existingUser = await this.userRepository.findOneByUsername(username);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername);
      }

      const newUser = await this.userRepository.create({
        data: { username, role: role || Role.STUDENT },
        omit: { password: true },
      });

      await this.clearUsersCache();

      return {
        data: { user: newUser },
        error: false,
        message: UserMessages.CreatedUser,
        status: HttpStatus.CREATED,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(paginationDto?: IPagination): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.Users}_${paginationDto.page || 1}_${paginationDto.take || 20}`;
      const usersCache = await this.cache.get<User[] | null>(cacheKey);

      if (usersCache) {
        return {
          data: { ...pagination(paginationDto, usersCache) },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
      }

      const userExtraQuery: Prisma.UserFindManyArgs = {
        orderBy: { createdAt: `desc` },
        omit: { password: true },
      };

      const users = await this.userRepository.findAll(userExtraQuery);

      const redisKeys = {
        key: cacheKey,
        value: users,
        expireTime: 300, //* Seconds
      };

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return {
        data: { ...pagination(paginationDto, users) },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findById(userDto: { userId: number }): Promise<ServiceResponse> {
    try {
      const user = await this.userRepository.findById(userDto.userId, { omit: { password: true } });

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser);
      }

      return {
        data: { user },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByIdentifier({ identifier }: { identifier: string }): Promise<ServiceResponse> {
    try {
      const user = await this.userRepository.findOneByIdentifier(identifier);

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser);
      }

      return {
        data: { user },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async removeUserById(userDto: { userId: number }): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.findById(userDto.userId, { omit: { password: true } });

      if (!existingUser) {
        throw new NotFoundException(UserMessages.NotFoundUser);
      }

      const removedUser = await this.userRepository.delete(userDto.userId, { omit: { password: true } });

      await this.clearUsersCache();

      return {
        data: { removedUser },
        error: false,
        message: UserMessages.RemovedUserSuccess,
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOrCreate(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto);

      if (existingUser) {
        return {
          data: { user: existingUser },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
      }

      return await this.create(userDto);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async search({ query, ...paginationDto }: ISearchUser): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.SearchUsers}_${query}_${paginationDto.page || 1}_${paginationDto.take || 20}`;

      const cacheUsers = await this.cache.get<User[] | null>(cacheKey);

      if (cacheUsers) {
        return {
          data: { ...pagination(paginationDto, cacheUsers) },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
      }

      const userExtraQuery: Prisma.UserFindManyArgs = {
        omit: { password: true },
        orderBy: { createdAt: 'desc' },
        where: {
          OR: [
            {
              username: { contains: query, mode: 'insensitive' },
            },
            {
              mobile: { contains: query, mode: 'insensitive' },
            },
          ],
        },
      };

      const users = await this.userRepository.findAll(userExtraQuery);

      const redisKeys = {
        key: cacheKey,
        value: users,
        expireTime: 300, //* Seconds
      };

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return {
        data: { ...pagination(paginationDto, users) },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async clearUsersCache(): Promise<void> {
    await this.cache.delByPattern(CachePatterns.UsersList);
    await this.cache.delByPattern(CachePatterns.SearchUsersList);
  }
}
