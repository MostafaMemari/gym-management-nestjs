import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLE_KEY } from '../decorators/role.decorator';
import { Request } from 'express';
import { User } from '../dtos/user.dto';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredRoles = this.reflector.get<string[]>(ROLE_KEY, context.getHandler());

    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest() as Request;

    return requiredRoles.includes((user as User).role);
  }
}
