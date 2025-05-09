import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Observable } from 'rxjs';
import { handleError } from '../utils/handleError.utils';
import { Request } from 'express';
import { match } from 'path-to-regexp';
import { User } from '../interfaces/user.interface';
import { Reflector } from '@nestjs/core';
import { SKIP_AUTH } from '../decorators/skip-auth.decorator';
import { SKIP_PERMISSION } from '../decorators/skip-permission.decorator';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    try {
      const isSkippedAuth = this.reflector.get<boolean>(SKIP_AUTH, context.getHandler());
      const isSkippedPermission = this.reflector.get<boolean>(SKIP_PERMISSION, context.getHandler());

      if (isSkippedAuth || isSkippedPermission) return true;

      const req: Request = context.switchToHttp().getRequest();
      const user = req.user as User;

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
