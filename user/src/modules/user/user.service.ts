import { BadRequestException, ConflictException, ForbiddenException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { UserMessages } from '../../common/enums/user.messages';
import { IGetUserByArgs, ISearchUser, IUpdateUser, IUsersFilter, IVerifyMobile } from '../../common/interfaces/user.interface';
import { pagination } from '../../common/utils/pagination.utils';
import { RpcException } from '@nestjs/microservices';
import { UserRepository } from './user.repository';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../../common/enums/cache.enum';
import { ResponseUtil } from '../../common/utils/response.utils';
import { sortObject } from '../../common/utils/functions.utils';
import { RoleRepository } from '../role/role.repository';
import { DefaultRole } from '../../common/enums/shared.enum';
import { RoleMessages } from '../../common/enums/role.messages';

@Injectable()
export class UserService {
  REDIS_EXPIRE_TIME = 600; //* Seconds

  constructor(
    private readonly userRepository: UserRepository,
    private readonly roleRepository: RoleRepository,
    private readonly cache: CacheService,
  ) {}

  async create(userDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const existingUser = await this.userRepository.isExistingUser(userDto);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUser);
      }

      const countUsers = await this.userRepository.count();
      let role: null | Role = null;

      if (countUsers == 0) {
        role = await this.roleRepository.findOne({ name: DefaultRole.SUPER_ADMIN });
      } else {
        role = await this.roleRepository.findOne({ name: DefaultRole.GUEST });
      }

      if (!role) throw new BadRequestException(RoleMessages.NotSyncedRoles);

      const user = await this.userRepository.create({
        data: { ...userDto, roles: { connect: role } },
        omit: { password: true },
        include: { roles: true },
      });

      return ResponseUtil.success({ user }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createUserStudent(userStudentDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const { username } = userStudentDto;

      const existingUser = await this.userRepository.findOneByUsername(username);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername);
      }

      const newUser = await this.userRepository.create({
        data: { username, isVerifiedMobile: true },
        omit: { password: true },
        include: { roles: true },
      });

      return ResponseUtil.success({ user: newUser }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async createUserCoach(userCoachDto: Prisma.UserCreateInput): Promise<ServiceResponse> {
    try {
      const { username } = userCoachDto;

      const existingUser = await this.userRepository.findOneByUsername(username);

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUserWithUsername);
      }

      const newUser = await this.userRepository.create({
        data: { username, isVerifiedMobile: true },
        omit: { password: true },
        include: { roles: true },
      });

      return ResponseUtil.success({ user: newUser }, UserMessages.CreatedUser, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll({ page, take, ...usersFilterDto }: IUsersFilter): Promise<ServiceResponse> {
    try {
      const paginationDto = { take, page };
      const { endDate, lastPasswordChange, mobile, startDate, username, sortBy, sortDirection, includeRoles } = usersFilterDto;

      const sortedDto = sortObject(usersFilterDto);

      const cacheKey = `${CacheKeys.Users}_${JSON.stringify(sortedDto)}`;

      const usersCache = await this.cache.get<null | User[]>(cacheKey);

      if (usersCache) return ResponseUtil.success({ ...pagination(paginationDto, usersCache) }, '', HttpStatus.OK);

      const filters: Partial<Prisma.UserWhereInput> = {};

      if (lastPasswordChange) filters.lastPasswordChange = new Date(lastPasswordChange);
      if (mobile) filters.mobile = { contains: mobile, mode: 'insensitive' };
      if (username) filters.username = { contains: username, mode: 'insensitive' };
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const users = await this.userRepository.findAll({
        where: filters,
        omit: { password: true },
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
        include: { roles: includeRoles },
      });

      await this.cache.set(cacheKey, users, this.REDIS_EXPIRE_TIME);

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
      const { mobile } = userDto;

      const user = await this.userRepository.findOneByIdentifier(mobile);

      if (!user) {
        throw new NotFoundException(UserMessages.NotFoundUser);
      }

      return ResponseUtil.success({ user }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByIds(userDto: { usersIds: number[] }) {
    try {
      if (!userDto.usersIds?.length) return ResponseUtil.success({ users: [] }, '', HttpStatus.OK);

      const users = await this.userRepository.findAll({ where: { id: { in: userDto.usersIds } }, omit: { password: true } });

      return ResponseUtil.success({ users }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
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
        expireTime: this.REDIS_EXPIRE_TIME,
      };

      await this.cache.set(redisKeys.key, redisKeys.value, redisKeys.expireTime);

      return ResponseUtil.success({ ...pagination(paginationDto, users) }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update(data: IUpdateUser) {
    try {
      const { userId, ...updateUserData } = data;
      const { mobile, username } = updateUserData;

      const existingUser = await this.userRepository.findById(userId, { where: { id: { not: userId }, OR: [{ mobile }, { username }] } });

      if (existingUser) {
        throw new ConflictException(UserMessages.AlreadyExistsUser);
      }

      const currentUser = await this.userRepository.findByIdAndThrow(userId);

      const isMobileChanged = mobile !== currentUser.mobile;
      const HOURS_LIMIT = 24;
      const timeSinceLastMobileChange = Date.now() - new Date(currentUser.lastMobileChange).getTime();

      //* Allow mobile number change only if 24 hours have passed since the last change
      if (isMobileChanged && currentUser.lastMobileChange) {
        if (timeSinceLastMobileChange < HOURS_LIMIT * 60 * 60 * 1000) {
          throw new ForbiddenException(UserMessages.MobileChangeLimit);
        }
      }

      const updatedUser = await this.userRepository.update(userId, {
        data: {
          ...updateUserData,
          lastMobileChange: isMobileChanged ? new Date() : undefined,
          perviousMobile: isMobileChanged ? currentUser.mobile : undefined,
        },
        omit: { password: true },
      });

      return ResponseUtil.success({ updatedUser }, UserMessages.UpdatedUser, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async revertMobile({ userId }: { userId: number }) {
    try {
      const user = await this.userRepository.findByIdAndThrow(userId);

      if (user.isVerifiedMobile || !user.perviousMobile) {
        throw new BadRequestException(UserMessages.MobileVerifiedOrPrevNotFound);
      }

      const updatedUser = await this.userRepository.update(userId, {
        data: { perviousMobile: null, mobile: user.perviousMobile, isVerifiedMobile: true, lastMobileChange: null },
        omit: { password: true },
      });

      return ResponseUtil.success<{ user: User }>({ user: updatedUser }, UserMessages.RevertedMobileSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findByArgs(userDto: IGetUserByArgs) {
    try {
      const user = await this.userRepository.findByArgs(userDto);

      if (!user) {
        return ResponseUtil.success({}, '', HttpStatus.OK);
      }

      return ResponseUtil.success({ user }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verifyMobile({ mobile }: IVerifyMobile) {
    try {
      const user = await this.userRepository.findByArgs({ mobile });

      if (!user) throw new NotFoundException(UserMessages.NotFoundUser);

      if (user.isVerifiedMobile) throw new ConflictException(UserMessages.AlreadyVerifiedMobile);

      await this.userRepository.update(user.id, { data: { perviousMobile: null, isVerifiedMobile: true } });

      return ResponseUtil.success({ user }, UserMessages.VerifiedMobileSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async removeUsers({ userIds = [] }: { userIds: number[] }): Promise<ServiceResponse> {
    try {
      userIds = userIds.filter((id) => id);

      const result = await this.userRepository.deleteMany(userIds);

      return ResponseUtil.success({ count: result.count }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
