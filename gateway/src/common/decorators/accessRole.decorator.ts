import { ApiOperation } from '@nestjs/swagger';
import { Role } from '../enums/auth-user-service/role.enum';

export function AccessRole(roles: Role | Role[]) {
  const message = 'Access roles granted: ';
  if (!Array.isArray(roles)) return ApiOperation({ summary: message + roles });
  return ApiOperation({ summary: message + roles.join(' & ') });
}
