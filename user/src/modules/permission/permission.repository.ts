import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Permission, Prisma } from '@prisma/client';
import { PermissionMessages } from '../../common/enums/permission.messages';

export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(args: Prisma.PermissionCreateInput): Promise<Permission> {
    return this.prisma.permission.create({ data: args, include: { roles: true } });
  }

  findOne(args: Prisma.PermissionWhereInput, additionalArgs: Omit<Prisma.PermissionFindFirstArgs, `where`> = {}): Promise<Permission | null> {
    return this.prisma.permission.findFirst({ where: args, ...additionalArgs });
  }

  async findOneOrThrow(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: { id },
      include: { roles: true },
    });

    if (!permission) throw new NotFoundException(PermissionMessages.NotFoundPermission);

    return permission;
  }
}
