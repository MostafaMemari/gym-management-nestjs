import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../dtos/user.dto';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();

    return req.user;
  },
);
