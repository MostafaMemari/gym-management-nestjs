import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { PermissionGuard } from '../guards/permission.guard';

export function AuthDecorator() {
  return applyDecorators(ApiBearerAuth('Authorization'), UseGuards(AuthGuard, PermissionGuard));
}
