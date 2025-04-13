import { ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { IAssignPermission, ICreateRole, IRolesFilter } from '../../common/interfaces/role.interface';
import { RpcException } from '@nestjs/microservices';
import { RoleRepository } from './role.repository';
import { ResponseUtil } from '../../common/utils/response.utils';
import { RoleMessages } from '../../common/enums/role.messages';
import { sortObject } from '../../common/utils/functions.utils';
import { CacheKeys } from '../../common/enums/cache.enum';
import { CacheService } from '../cache/cache.service';
import { pagination } from '../../common/utils/pagination.utils';
import { Prisma, Role } from '@prisma/client';

@Injectable()
export class RoleService {
  private readonly CACHE_EXPIRE_TIME = 600; //* Seconds

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(createRoleDto: ICreateRole) {
    try {
      const role = await this.roleRepository.findOne({ name: createRoleDto.name });

      if (role) throw new ConflictException(RoleMessages.AlreadyExistsRole);

      const newRole = await this.roleRepository.create({
        name: createRoleDto.name,
        permissions: {
          connectOrCreate: createRoleDto.permissions?.map((p) => ({ create: p, where: { method_endpoint: p } })),
        },
      });

      return ResponseUtil.success({ role: newRole }, RoleMessages.CreatedRoleSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne({ roleId }: { roleId: number }) {
    try {
      const role = await this.findRoleOrThrow(roleId);

      return ResponseUtil.success({ role }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll({ page, take, ...filtersDto }: IRolesFilter) {
    try {
      const paginationDto = { page, take };
      const { endDate, includePermissions, includeUsers, name, sortBy, sortDirection, startDate } = filtersDto;
      const sortedDto = sortObject(filtersDto);
      const cacheKey = `${CacheKeys.Roles}_${JSON.stringify(sortedDto)}`;

      const rolesCache = await this.cacheService.get<Role[] | null>(cacheKey);

      if (rolesCache) return ResponseUtil.success(pagination(paginationDto, rolesCache), ``, HttpStatus.OK);

      const filters: Prisma.RoleWhereInput = {};

      if (name) filters.name = { contains: name };
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const roles = await this.roleRepository.findAll({
        where: filters,
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
        include: { permissions: includePermissions, users: includeUsers },
      });

      await this.cacheService.set(cacheKey, roles, this.CACHE_EXPIRE_TIME);

      return ResponseUtil.success(pagination(paginationDto, roles), ``, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async assignPermission({ roleId, permissionId }: IAssignPermission) {
    try {
      // TODO: Check and validate permission id

      await this.findRoleOrThrow(roleId);

      const foundRole = await this.roleRepository.findOne({ id: roleId, permissions: { some: { id: permissionId } } });

      if (foundRole) throw new ConflictException(RoleMessages.AlreadyExistsPermissionInRole);

      const updatedRole = await this.roleRepository.update(roleId, {
        data: { permissions: { set: { id: permissionId } } },
        include: { permissions: true, users: true },
      });

      return ResponseUtil.success({ role: updatedRole }, RoleMessages.AssignPermissionSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async findRoleOrThrow(identifier: string | number) {
    const existingRole = await this.roleRepository.findOne({
      OR: [typeof identifier == 'string' ? { name: identifier } : undefined, typeof identifier == `number` ? { id: identifier } : undefined].filter(
        Boolean,
      ),
    });

    if (!existingRole) throw new NotFoundException(RoleMessages.NotFoundRole);

    return existingRole;
  }
}
