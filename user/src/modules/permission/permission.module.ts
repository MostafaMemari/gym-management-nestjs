import { Module } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { PermissionController } from './permission.controller';
import { PermissionRepository } from './permission.repository';
import { CacheService } from '../cache/cache.service';

@Module({
  controllers: [PermissionController],
  providers: [PermissionService, PermissionRepository, CacheService],
})
export class PermissionModule {}
