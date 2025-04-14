import { ConflictException, HttpStatus, Injectable } from '@nestjs/common';
import { PermissionRepository } from './permission.repository';
import { ICreatePermission } from '../../common/interfaces/permission.interface';
import { RpcException } from '@nestjs/microservices';
import { ResponseUtil } from '../../common/utils/response.utils';
import { PermissionMessages } from '../../common/enums/permission.messages';

@Injectable()
export class PermissionService {
  constructor(private readonly permissionRepository: PermissionRepository) {}

  async create({ endpoint, method }: ICreatePermission) {
    try {
      const foundPermission = await this.permissionRepository.findOne({ method, endpoint });

      if (foundPermission) throw new ConflictException(PermissionMessages.AlreadyExistsPermission);

      const newPermission = await this.permissionRepository.create({ endpoint, method });

      return ResponseUtil.success({ permission: newPermission }, PermissionMessages.CreatedPermissionSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOne({ permissionId }: { permissionId: number }) {
    try {
      const permission = await this.permissionRepository.findOneOrThrow(permissionId);

      return ResponseUtil.success({ permission }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
