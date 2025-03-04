import { PrismaService } from "../prisma/prisma.service";

export class WalletRepository {
    constructor(private readonly prismaService: PrismaService) { }

    create(userId: number) {
        return this.prismaService.wallet.create({ data: { userId } })
    }

    findOne(walletId: number) {
        return this.prismaService.wallet.findFirst({ where: { id: walletId } })
    }

    findOneByUser(userId: number) {
        return this.prismaService.wallet.findFirst({ where: { userId } })
    }
}