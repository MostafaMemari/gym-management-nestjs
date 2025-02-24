import { Injectable, NestMiddleware, RequestMethod } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as basicAuth from 'express-basic-auth';

@Injectable()
export class BasicAuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const { BASIC_AUTH_USERNAME, BASIC_AUTH_PASSWORD } = process.env;

    if (req.url.includes('swagger') && req.method.toLowerCase() == 'get') {
      basicAuth({
        users: { [BASIC_AUTH_USERNAME]: BASIC_AUTH_PASSWORD },
        challenge: true,
      })(req, res, next);
      return;
    }
    next();
  }
}
