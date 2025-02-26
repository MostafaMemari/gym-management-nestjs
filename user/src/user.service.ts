import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { UserMessages } from './common/enums/user.messages';
import { IChangeRole, IPagination, ISearchUser, IUpdateUser } from './common/interfaces/user.interface';
import { pagination } from './common/utils/pagination.utils';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from './user.repository';
import { CacheService } from './cache/cache.service';
import { CacheKeys } from './common/enums/cache.enum';
import { ResponseUtil } from './common/utils/response.utils';

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly cache: CacheService,
  ) { }

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

      return ResponseUtil.success({ user }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createUserStudent(userStudentDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const { username, role } = userStudentDto;

      const existingUser = await this.userRepository.findOneByUsername(username);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername);
      }

      const newUser = await this.userRepository.create({
        data: { username, role: role || Role.STUDENT },
        omit: { password: true },
      });

      return ResponseUtil.success({ user: newUser }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createUserCoach(userCoachDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const { username, role } = userCoachDto;

      const existingUser = await this.userRepository.findOneByUsername(username);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername);
      }

      const newUser = await this.userRepository.create({
        data: { username, role: role || Role.COACH },
        omit: { password: true },
      });

      return ResponseUtil.success({ user: newUser }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll(paginationDto?: IPagination): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.Users}_${paginationDto.page || 1}_${paginationDto.take || 20}`;
      const usersCache = await this.cache.get<User[] | null>(cacheKey);

      if (usersCache) {
        return ResponseUtil.success({ ...pagination(paginationDto, usersCache) }, '', HttpStatus.OK);
      }

      const userExtraQuery: Prisma.UserFindManyArgs = {
        orderBy: { createdAt: `desc` },
        omit: { password: true },
      };

      const users = await this.userRepository.findAll(userExtraQuery);

      const redisKeys = {
        key: cacheKey,
        value: users,
        expireTime: 600, //* Seconds
      };

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return ResponseUtil.success({ ...pagination(paginationDto, users) }, '', HttpStatus.OK);
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

      return ResponseUtil.success({ user }, '', HttpStatus.OK);
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

      return ResponseUtil.success({ user }, '', HttpStatus.OK);
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

      return ResponseUtil.success({ removedUser }, UserMessages.RemovedUserSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOrCreate(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto);

      if (existingUser) {
        return ResponseUtil.success({ user: existingUser }, '', HttpStatus.OK);
      }

      return await this.create(userDto);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByMobile(userDto: { mobile: string }) {
    try {
      const { mobile } = userDto

      const user = await this.userRepository.findOneByIdentifier(mobile)

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser)
      }

      return ResponseUtil.success({ user }, "", HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async search({ query, ...paginationDto }: ISearchUser): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.SearchUsers}_${query}_${paginationDto.page || 1}_${paginationDto.take || 20}`;

      const cacheUsers = await this.cache.get<User[] | null>(cacheKey);

      if (cacheUsers) {
        return ResponseUtil.success({ ...pagination(paginationDto, cacheUsers) }, '', HttpStatus.OK);
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
        expireTime: 600, //* Seconds
      };

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return ResponseUtil.success({ ...pagination(paginationDto, users) }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async changeRole(roleDto: IChangeRole): Promise<ServiceResponse> {
    try {
      const { role, userId } = roleDto

      const user = await this.userRepository.findByIdAndThrow(userId)

      if (user.role == role) throw new ConflictException(UserMessages.AlreadyAssignedRole)

      await this.userRepository.updateRole(userId, role)

      return ResponseUtil.success({}, UserMessages.ChangedRoleSuccess, HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async update(data: IUpdateUser) {
    try {
      const { userId, mobile, username, password } = data

      const existingUser = await this.userRepository.findById(userId, { where: { id: { not: userId }, OR: [{ mobile }, { username }] } })

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUser)
      }

      const updatedUser = await this.userRepository.update(userId, { data: { mobile, username, password }, omit: { password: true } })

      return ResponseUtil.success({ updatedUser }, UserMessages.UpdatedUser, HttpStatus.OK)
    } catch (error) {
      throw new RpcException(error)
    }
  }
}