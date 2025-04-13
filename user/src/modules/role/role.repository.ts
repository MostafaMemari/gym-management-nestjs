import { Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
}
