import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { Services } from '../enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { AuthPatterns } from '../enums/auth-user-service/auth.events';
import { ServiceResponse } from '../interfaces/serviceResponse.interface';
import { UserPatterns } from '../enums/auth-user-service/user.events';
import { User } from '../interfaces/user.interface';
import { Reflector } from '@nestjs/core';
import { SKIP_AUTH } from '../decorators/skip-auth.decorator';
import { checkConnection } from '../utils/checkConnection.utils';
import { handleError } from '../utils/handleError.utils';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Services.AUTH_USER) private readonly authServiceClientProxy: ClientProxy,
    @Inject(Services.AUTH_USER) private readonly userServiceClientProxy: ClientProxy,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isSkipped = this.reflector.get<boolean>(SKIP_AUTH, context.getHandler());

      if (isSkipped) return true;

      await checkConnection(Services.AUTH_USER, this.authServiceClientProxy);
      await checkConnection(Services.AUTH_USER, this.userServiceClientProxy);

      const req: Request = context.switchToHttp().getRequest();

      const { authorization } = req.headers;

      if (!authorization) {
        throw new UnauthorizedException('Authorization header is required');
      }

      const [bearer, token] = authorization.split(' ');

      if (!bearer || bearer.toLowerCase() !== 'bearer') {
        throw new UnauthorizedException('Bearer token is invalid');
      }

      if (!token) throw new UnauthorizedException('token is required');

      const verifyTokenRes: ServiceResponse = await lastValueFrom(
        this.authServiceClientProxy.send(AuthPatterns.VerifyAccessToken, {
          accessToken: token,
        }),
      );

      if (verifyTokenRes?.error) {
        throw new UnauthorizedException(verifyTokenRes.message);
      }

      if (!verifyTokenRes?.data?.userId) {
        throw new UnauthorizedException('User account not found');
      }

      const { userId } = verifyTokenRes.data;

      const userRes: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserById, { userId }));

      if (userRes.error) {
        throw new UnauthorizedException(userRes.message);
      }

      req.user = userRes.data?.user as User;

      return true;
    } catch (error) {
      handleError(error, '', '');
    }
  }
}
