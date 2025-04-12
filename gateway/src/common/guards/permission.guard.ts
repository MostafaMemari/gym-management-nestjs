import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { handleError } from '../utils/handleError.utils';
import { Request } from 'express';
import { match } from 'path-to-regexp';
import { User } from '../interfaces/user.interface';
import { Role } from '../enums/role.enum';
import { Reflector } from '@nestjs/core';
import { SKIP_AUTH } from '../decorators/skip-auth.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const isSkipped = this.reflector.get<boolean>(SKIP_AUTH, context.getHandler());

      if (isSkipped) return true;

      const req: Request = context.switchToHttp().getRequest();
      const user = req.user as User;

      const isSuperAdmin = user && user.roles.some((role) => role.name == Role.SUPER_ADMIN);

      if (isSuperAdmin) return isSuperAdmin;

      const fullUrl = `${req.protocol}://${req.get(`host`)}${req.route.path}`;

      const matcher = match(fullUrl.replace(process.env.BASE_URL, ''));

      const hasPermission = user.roles.some((role) =>
        role.permissions.some((p) => p.method.toLowerCase() == req.method.toLowerCase() && matcher(p.endpoint)),
      );

      return hasPermission;
    } catch (error) {
      handleError(error, '', '');
    }
  }
}
