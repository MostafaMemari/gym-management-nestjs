import { Module } from '@nestjs/common';
import { RbacService } from './rbac.service';
import { RbacController } from './rbac.controller';

@Module({
  controllers: [RbacController],
  providers: [RbacService],
})
export class RbacModule {}
