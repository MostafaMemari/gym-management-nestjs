import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import { ICreatePermission, IPermissionFilter, IUpdatePermission } from '../../common/interfaces/permission.interface';
import { RpcException } from '@nestjs/microservices';
import { ResponseUtil } from '../../common/utils/response.utils';
import { PermissionMessages } from '../../common/enums/permission.messages';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { sortObject } from '../../common/utils/functions.utils';
import { CacheKeys } from '../../common/enums/cache.enum';
import { CacheService } from '../cache/cache.service';
import { Permission, Prisma } from '@prisma/client';
import { pagination } from '../../common/utils/pagination.utils';

@Injectable()
export class PermissionService {
  private readonly CACHE_EXPIRE_TIME = 600; //* Seconds

  constructor(
    private readonly permissionRepository: PermissionRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create({ endpoint, method }: ICreatePermission): Promise<ServiceResponse> {
    try {
      const foundPermission = await this.permissionRepository.findOne({ method, endpoint });

      if (foundPermission) throw new ConflictException(PermissionMessages.AlreadyExistsPermission);

      const newPermission = await this.permissionRepository.create({ endpoint, method });

      return ResponseUtil.success({ permission: newPermission }, PermissionMessages.CreatedPermissionSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne({ permissionId }: { permissionId: number }): Promise<ServiceResponse> {
    try {
      const permission = await this.permissionRepository.findOneOrThrow(permissionId);

      return ResponseUtil.success({ permission }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAll({ page, take, ...filtersDto }: IPermissionFilter): Promise<ServiceResponse> {
    try {
      const paginationDto = { page, take };
      const { endDate, sortBy, sortDirection, startDate, endpoint, includeRoles, method } = filtersDto;
      const sortedDto = sortObject(filtersDto);
      const cacheKey = `${CacheKeys.Permissions}_${JSON.stringify(sortedDto)}`;

      const permissionsCache = await this.cacheService.get<Permission[] | null>(cacheKey);

      if (permissionsCache) return ResponseUtil.success(pagination(paginationDto, permissionsCache), ``, HttpStatus.OK);

      const filters: Prisma.PermissionWhereInput = {};

      if (endpoint) filters.endpoint = { contains: endpoint };
      if (method) filters.method = { contains: method };
      if (startDate || endDate) {
        filters.createdAt = {};
        if (startDate) filters.createdAt.gte = new Date(startDate);
        if (endDate) filters.createdAt.lte = new Date(endDate);
      }

      const permissions = await this.permissionRepository.findAll({
        where: filters,
        orderBy: { [sortBy || 'createdAt']: sortDirection || 'desc' },
        include: { roles: includeRoles },
      });

      await this.cacheService.set(cacheKey, permissions, this.CACHE_EXPIRE_TIME);

      return ResponseUtil.success(pagination(paginationDto, permissions), ``, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async update({ endpoint, method, permissionId }: IUpdatePermission): Promise<ServiceResponse> {
    try {
      await this.permissionRepository.findOneOrThrow(permissionId);

      const updatedRole = await this.permissionRepository.update(permissionId, { data: { endpoint, method }, include: { roles: true } });

      return ResponseUtil.success({ role: updatedRole }, PermissionMessages.UpdatedPermissionSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async remove({ permissionId }: { permissionId: number }): Promise<ServiceResponse> {
    try {
      await this.permissionRepository.findOneOrThrow(permissionId);

      const deletedRole = await this.permissionRepository.delete(permissionId, { include: { roles: true } });

      return ResponseUtil.success({ role: deletedRole }, PermissionMessages.RemovedPermissionSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
