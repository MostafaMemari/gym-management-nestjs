import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { CacheService } from '../cache/cache.service';
import { PrismaController } from './prisma.controller';

@Global()
@Module({
  providers: [PrismaService, CacheService],
  controllers: [PrismaController],
  exports: [PrismaService],
})
export class PrismaModule {}
