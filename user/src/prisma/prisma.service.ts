import { forwardRef, Inject, Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { CacheService } from '../cache/cache.service';
import { CachePatterns } from '../common/enums/cache.enum';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {

    constructor(@Inject(forwardRef(() => CacheService)) private readonly cacheService: CacheService) {
        super()
    }

    private readonly logger = new Logger("PrismaService")

    async onModuleInit() {
        await this.$connect()
        this.logger.log("Database connected successfully.")
        this.useMiddleware()
    }

    async onModuleDestroy() {
        await this.$disconnect()
        this.logger.log("Disconnected from database.")
    }

    useMiddleware(): void {
        this.$use(async (params, next) => {
            const { action } = params

            if (['create', 'update', 'delete'].includes(action)) {
                //* Clear user cache on create, update, or delete
                await this.cacheService.delByPattern(CachePatterns.UsersList)
                await this.cacheService.delByPattern(CachePatterns.SearchUsersList)
            }

           return next(params)
        })
    }
}