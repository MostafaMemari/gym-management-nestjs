import { SetMetadata } from '@nestjs/common';

export const ROLE_KEY = 'roles';

export const Roles = (...roles: string[]) => SetMetadata(ROLE_KEY, roles);
