import { Module } from '@nestjs/common';
import { PermissionController } from './permission.controller';
import { PermissionService } from './permission.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig())
  ],
  controllers: [PermissionController],
  providers: [PermissionService],
})
export class PermissionModule { }
