import { Permission, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { RoleMessages } from '../../common/enums/role.messages';

@Injectable()
export class RoleRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(args: Prisma.RoleCreateInput): Promise<Role> {
    return this.prisma.role.create({ data: args, include: { _count: true, users: true, permissions: true } });
  }

  findOne(args: Prisma.RoleWhereInput, additionalArgs: Omit<Prisma.RoleFindFirstArgs, `where`> = {}): Promise<Role | null> {
    return this.prisma.role.findFirst({ where: args, ...additionalArgs });
  }

  findAll(args: Prisma.RoleFindManyArgs): Promise<Role[]> {
    return this.prisma.role.findMany(args);
  }

  update(roleId: number, args: Omit<Prisma.RoleUpdateArgs, `where`>): Promise<Role> {
    return this.prisma.role.update({ where: { id: roleId }, ...args });
  }

  delete(roleId: number, args: Omit<Prisma.RoleDeleteArgs, `where`> = {}): Promise<Role> {
    return this.prisma.role.delete({ where: { id: roleId }, ...args });
  }

  upsert(args: Prisma.RoleUpsertArgs): Promise<Role> {
    return this.prisma.role.upsert(args);
  }

  findOnePermission(
    args: Prisma.PermissionWhereInput,
    additionalArgs: Omit<Prisma.PermissionFindFirstArgs, `where`> = {},
  ): Promise<Permission | null> {
    return this.prisma.permission.findFirst({ where: args, ...additionalArgs });
  }

  findAllPermissions(args: Prisma.PermissionFindManyArgs): Promise<Permission[]> {
    return this.prisma.permission.findMany(args);
  }

  async findOnePermissionByIdOrThrow(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: { id },
      include: { roles: true },
    });

    if (!permission) throw new NotFoundException(RoleMessages.NotFoundPermission);

    return permission;
  }

  async findOneByIdOrThrow(roleId: number): Promise<Role | never> {
    const existingRole = await this.findOne({ id: roleId }, { include: { permissions: true, users: { omit: { password: true } } } });

    if (!existingRole) throw new NotFoundException(RoleMessages.NotFoundRole);

    return existingRole;
  }
}
