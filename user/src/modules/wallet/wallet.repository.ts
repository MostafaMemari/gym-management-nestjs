import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: number) {
    return this.prisma.wallet.create({ data: { userId } });
  }

  findOne(walletId: number) {
    return this.prisma.wallet.findFirst({ where: { id: walletId } });
  }

  findOneByUser(userId: number) {
    return this.prisma.wallet.findFirst({ where: { userId } });
  }

  findAll() {
    return this.prisma.wallet.findMany();
  }
}
