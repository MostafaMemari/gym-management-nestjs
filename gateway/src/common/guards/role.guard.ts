import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../decorators/role.decorator';
import { Request } from 'express';
import { User } from '../interfaces/user.interface';
import { handleError } from '../utils/handleError.utils';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    try {
      const requiredRoles = this.reflector.get<string[]>(ROLE_KEY, context.getHandler());

      if (!requiredRoles) return true;

      const { user } = context.switchToHttp().getRequest() as Request;

      return requiredRoles.includes((user as User).role);
    } catch (error) {
      handleError(error, '', '');
    }
  }
}
