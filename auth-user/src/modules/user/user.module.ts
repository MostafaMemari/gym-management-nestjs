import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module';
import envConfig from '../../configs/env.config';
import { UserRepository } from './user.repository';
import { CacheModule } from '../cache/cache.module';
import { WalletModule } from '../wallet/wallet.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from '../../common/enums/services.enum';
import { AuthModule } from '../auth/auth.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    forwardRef(() => WalletModule),
    CacheModule,
    PrismaModule,
    RbacModule,
    AuthModule,
    ClientsModule.register([
      {
        name: Services.CLUB,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_CLUB_SERVICE_QUEUE,
        },
      },
      {
        name: Services.NOTIFICATION,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_NOTIFICATION_SERVICE_QUEUE,
        },
      },
    ]),
  ],
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [ClientsModule],
})
export class UserModule {}
