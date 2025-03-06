import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CacheService } from '../cache/cache.service';

@Module({
  providers: [PrismaService, CacheService],
  exports: [PrismaService],
})
export class PrismaModule {}
