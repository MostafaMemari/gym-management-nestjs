import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Transaction } from '@prisma/client';

@Injectable()
export class PaymentRepository {
  constructor(private readonly prisma: PrismaService) { }

  create(data: Prisma.TransactionCreateInput) {
    return this.prisma.transaction.create({ data });
  }

  findOneByArgs(args: Partial<Transaction>) {
    return this.prisma.transaction.findFirst({ where: { ...args } });
  }

  findByArgs(args: Partial<Transaction> = {}) {
    return this.prisma.transaction.findMany({ where: { ...args } });
  }

  update(transactionId: number, data: Partial<Transaction>) {
    return this.prisma.transaction.update({ where: { id: transactionId }, data: { ...data, updatedAt: new Date() } });
  }
}
