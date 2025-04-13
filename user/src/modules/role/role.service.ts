import { BadRequestException, ConflictException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { IAssignPermission, ICreateRole } from '../../common/interfaces/role.interface';
import { RpcException } from '@nestjs/microservices';
import { RoleRepository } from './role.repository';
import { ResponseUtil } from '../../common/utils/response.utils';
import { RoleMessages } from '../../common/enums/role.messages';

@Injectable()
export class RoleService {
  constructor(private readonly roleRepository: RoleRepository) {}

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

  async assignPermission({ roleId, permissionId }: IAssignPermission) {
    try {
      // TODO: Check and validate permission id

      await this.findRoleOrThrow(roleId);

      const foundRole = await this.roleRepository.findOne({ id: roleId, permissions: { some: { id: permissionId } } });

      if (foundRole) throw new ConflictException(RoleMessages.AlreadyExistsPermissionInRole);

      const updatedRole = await this.roleRepository.update(roleId, { data: { permissions: { set: { id: permissionId } } } });

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
