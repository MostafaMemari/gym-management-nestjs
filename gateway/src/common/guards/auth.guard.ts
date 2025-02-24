import {
  CanActivate,
  ExecutionContext,
  forwardRef,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Services } from '../enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { Request } from 'express';
import { lastValueFrom } from 'rxjs';
import { AuthPatterns } from '../enums/auth.events';
import { ServiceResponse } from '../interfaces/serviceResponse.interface';
import { UserPatterns } from '../enums/user.events';
import { AuthController } from '../../app/controllers/auth/auth.controller';
import { UserController } from '../../app/controllers/user.controller';
import { User } from '../dtos/user.dto';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(Services.AUTH) private readonly authServiceClientProxy: ClientProxy,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @Inject(forwardRef(() => AuthController))
    private readonly authController: AuthController,
    @Inject(forwardRef(() => UserController))
    private readonly userController: UserController,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    await this.authController.checkConnection();
    await this.userController.checkConnection();

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

    const userRes: ServiceResponse = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.GetUserById, { userId }),
    );

    if (userRes.error) {
      throw new UnauthorizedException(userRes.message);
    }

    req.user = userRes.data?.user as User;

    return true;
  }
}
