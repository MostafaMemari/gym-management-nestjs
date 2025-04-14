import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { UserRepository } from '../user/user.repository';
import { RoleRepository } from './role.repository';
import { CacheService } from '../cache/cache.service';
import { PermissionRepository } from '../permission/permission.repository';

@Module({
  controllers: [RoleController],
  providers: [RoleService, UserRepository, RoleRepository, CacheService, PermissionRepository],
})
export class RoleModule {}
