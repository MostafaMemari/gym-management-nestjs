import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export class PermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOneOrThrow(id: number) {
    const permission = await this.prisma.permission.findFirst({
      where: { id },
      include: { roles: true },
    });

    if (!permission) throw new NotFoundException();

    return permission;
  }
}
