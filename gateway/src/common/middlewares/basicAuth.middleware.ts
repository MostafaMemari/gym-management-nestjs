import { Injectable, NestMiddleware, RequestMethod } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as basicAuth from 'express-basic-auth';
import { RequestHttpMethod } from '../enums/shared.enum';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD, NODE_ENV } = process.env;

    interface IAccessRoute<T = RequestMethod> {
      path: string;
      method: T;
    }

    const accessRoutes: IAccessRoute<RequestHttpMethod>[] = [
      {
        path: 'role/sync',
        method: RequestHttpMethod.GET,
      },
      {
        path: 'swagger',
        method: RequestHttpMethod.GET,
      },
    ];

    const hasAccess: boolean = accessRoutes.some((r) => req.url.includes(r.path) && r.method.toLowerCase() == req.method.toLowerCase());

    if (NODE_ENV == 'production' && hasAccess)
      return basicAuth({
        users: { [BASIC_AUTH_USERNAME]: BASIC_AUTH_PASSWORD },
        challenge: true,
      })(req, res, next);

    return next();
  }
}
