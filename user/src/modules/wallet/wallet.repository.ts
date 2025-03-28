import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Wallet, WalletDeduction } from '@prisma/client';
import { WalletMessages } from 'src/common/enums/wallet.messages';

@Injectable()
export class WalletRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(walletData: Prisma.WalletCreateInput) {
    return this.prisma.wallet.create({ data: walletData });
  }

  findOne(walletId: number) {
    return this.prisma.wallet.findFirst({ where: { id: walletId } });
  }

  findOneByUser(userId: number) {
    return this.prisma.wallet.findFirst({ where: { userId } });
  }

  findAll(args: Prisma.WalletFindManyArgs = {}) {
    return this.prisma.wallet.findMany(args);
  }

  async update(walletIdentifier: number, data: Partial<Wallet>): Promise<Wallet | never> {
    const wallet = await this.prisma.wallet.findFirst({
      where: { OR: [{ id: walletIdentifier }, { userId: walletIdentifier }] },
    });

    if (!wallet) throw new NotFoundException(WalletMessages.NotFoundWallet);

    return this.prisma.wallet.update({ where: { id: wallet.id }, data: { ...data, updatedAt: new Date() } });
  }

  createDeduction(data: Prisma.WalletDeductionCreateInput): Promise<Prisma.WalletDeductionCreateInput> {
    return this.prisma.walletDeduction.create({ data });
  }

  findAllDeductions(args: Prisma.WalletDeductionFindManyArgs = {}): Promise<WalletDeduction[]> {
    return this.prisma.walletDeduction.findMany(args);
  }
}
