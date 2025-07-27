import { forwardRef, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient, Role } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CacheKeys } from '../../common/enums/cache.enum';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(@Inject(forwardRef(() => CacheService)) private readonly cacheService: CacheService) {
    super();
  }

  private readonly logger = new Logger('PrismaService');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected successfully.');
    this.useMiddleware();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database.');
  }

  useMiddleware(): void {
    this.$use(async (params, next) => {
      const { action, model } = params;

      if (['create', 'update', 'delete'].includes(action)) {
        //* Clear user cache on create, update, or delete
        for (const key in CacheKeys) await this.cacheService.delByPattern(`${CacheKeys[key]}*`);
      }

      if (model == 'User' && action == 'update') {
        const beforeUser = await this.user.findFirst({ where: { id: params.args.where.id } });
        const wallet = await this.wallet.findFirst({ where: { userId: params.args.where.id } });

        const result = await next(params);

        if (wallet) return result;

        if (beforeUser && result.role == Role.ADMIN_CLUB) {
          await this.wallet.create({ data: { userId: beforeUser.id, lastWithdrawalDate: new Date() } });
        }

        return result;
      }

      return next(params);
    });
  }
}
