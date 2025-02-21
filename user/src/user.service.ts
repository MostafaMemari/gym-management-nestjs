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
import { CacheKeys } from './common/enums/cache.enum';
import { ResponseUtil } from './common/utils/response.utils';

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

<<<<<<< HEAD
      return ResponseUtil.success({ user }, UserMessages.CreatedUser, HttpStatus.CREATED)
=======
      await this.clearUsersCache();

      return {
        data: { user },
        error: false,
        message: UserMessages.CreatedUser,
        status: HttpStatus.CREATED,
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
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

<<<<<<< HEAD
      return ResponseUtil.success({ user: newUser }, UserMessages.CreatedUser, HttpStatus.CREATED)
=======
      await this.clearUsersCache();

      return {
        data: { user: newUser },
        error: false,
        message: UserMessages.CreatedUser,
        status: HttpStatus.CREATED,
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(paginationDto?: IPagination): Promise<ServiceResponse> {
    try {
<<<<<<< HEAD
      const cacheKey = `${CacheKeys.Users}_${paginationDto.page || 1}_${paginationDto.take || 20}`
      const usersCache = await this.cache.get<User[] | null>(cacheKey)
      
      if (usersCache) {
        return ResponseUtil.success({ ...pagination(paginationDto, usersCache) }, '', HttpStatus.OK)
=======
      const cacheKey = `${CacheKeys.Users}_${paginationDto.page || 1}_${paginationDto.take || 20}`;
      const usersCache = await this.cache.get<User[] | null>(cacheKey);

      if (usersCache) {
        return {
          data: { ...pagination(paginationDto, usersCache) },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
      }
      
      const userExtraQuery: Prisma.UserFindManyArgs = {
        orderBy: { createdAt: `desc` },
<<<<<<< HEAD
        omit: { password: true }
      }
      
      const users = await this.userRepository.findAll(userExtraQuery)
=======
        omit: { password: true },
      };

      const users = await this.userRepository.findAll(userExtraQuery);
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9

      const redisKeys = {
        key: cacheKey,
        value: users,
<<<<<<< HEAD
        expireTime: 600 //* Seconds
      }
=======
        expireTime: 300, //* Seconds
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return ResponseUtil.success({ ...pagination(paginationDto, users) }, '', HttpStatus.OK)
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

      return ResponseUtil.success({ user }, '', HttpStatus.OK)
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

      return ResponseUtil.success({ user }, '', HttpStatus.OK)
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

<<<<<<< HEAD
      return ResponseUtil.success({ removedUser }, UserMessages.RemovedUserSuccess, HttpStatus.OK)
=======
      await this.clearUsersCache();

      return {
        data: { removedUser },
        error: false,
        message: UserMessages.RemovedUserSuccess,
        status: HttpStatus.OK,
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOrCreate(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto);

      if (existingUser) {
<<<<<<< HEAD
        return ResponseUtil.success({ user: existingUser }, '', HttpStatus.OK)
=======
        return {
          data: { user: existingUser },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
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
<<<<<<< HEAD
        return ResponseUtil.success({ ...pagination(paginationDto, cacheUsers) }, '', HttpStatus.OK)
=======
        return {
          data: { ...pagination(paginationDto, cacheUsers) },
          error: false,
          message: '',
          status: HttpStatus.OK,
        };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
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
<<<<<<< HEAD
        expireTime: 600 //* Seconds
      }
=======
        expireTime: 300, //* Seconds
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

<<<<<<< HEAD
      return ResponseUtil.success({ ...pagination(paginationDto, users) }, '', HttpStatus.OK)
=======
      return {
        data: { ...pagination(paginationDto, users) },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
    } catch (error) {
      throw new RpcException(error);
    }
  }

<<<<<<< HEAD
=======
  async clearUsersCache(): Promise<void> {
    await this.cache.delByPattern(CachePatterns.UsersList);
    await this.cache.delByPattern(CachePatterns.SearchUsersList);
  }
>>>>>>> 13192ddb19ed94bc755dbe52e987a941fc5d9ef9
}
