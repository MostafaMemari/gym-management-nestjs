import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Wallet } from '@prisma/client';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(walletData: Prisma.WalletCreateInput) {
    return this.prisma.wallet.create({ data: walletData });
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

  update(userId: number, data: Partial<Wallet>) {
    return this.prisma.wallet.update({ where: { userId }, data })
  }
}
