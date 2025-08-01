import { forwardRef, Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from '../../common/enums/services.enum';
import { JwtModule } from '@nestjs/jwt';
import { redisConfig } from '../../configs/redis.config';
import { RedisModule } from '@nestjs-modules/ioredis';
import { RbacModule } from '../rbac/rbac.module';
import { RbacController } from '../rbac/rbac.controller';
import { RbacService } from '../rbac/rbac.service';
import { UserService } from '../user/user.service';
import { UserRepository } from '../user/user.repository';
import { CacheService } from '../cache/cache.service';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    JwtModule.register({ global: true }),
    RedisModule.forRoot(redisConfig()),
    ClientsModule.register([
      {
        name: Services.CLUB,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_CLUB_QUEUE_NAME,
        },
      },
    ]),
    forwardRef(() => RbacModule),
  ],
  controllers: [AuthController, RbacController],
  providers: [AuthService, RbacService, UserService, UserRepository, CacheService],
  exports: [ClientsModule],
})
export class AuthModule {}
