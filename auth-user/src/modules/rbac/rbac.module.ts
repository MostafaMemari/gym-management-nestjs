import { forwardRef, Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';
import { AuthService } from '../auth/auth.service';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [RbacController],
  providers: [RbacService, AuthService, UserService, UserRepository, CacheService],
})
export class RbacModule {}
