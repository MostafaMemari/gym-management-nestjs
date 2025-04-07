import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CacheService } from '../cache/cache.service';
import { PrismaController } from './prisma.controller';

@Module({
  providers: [PrismaService, CacheService],
  controllers: [PrismaController],
  exports: [PrismaService],
})
export class PrismaModule {}
