import { PrismaService } from "../prisma/prisma.service";

export class PermissionRepository {
    constructor(private readonly prisma: PrismaService) { }

    
}