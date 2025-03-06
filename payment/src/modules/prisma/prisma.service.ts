import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CachePatterns } from '../../common/enums/cache.enum';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  logger = new Logger(PrismaService.name);

  constructor(private readonly cacheService: CacheService) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.useMiddleware();
    this.logger.log('Connected to database.');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Disconnected from database.');
  }

  useMiddleware() {
    this.$use(async (params, next) => {
      if (['create', 'update', 'delete'].includes(params.action)) {
        await this.cacheService.delByPattern(CachePatterns.TransactionList);
      }

      return await next(params);
    });
  }
}
