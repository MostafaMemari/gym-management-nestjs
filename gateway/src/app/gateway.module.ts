import { Module, ValidationPipe } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './controllers/auth.controller';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../configs/env.config';
import { UserController } from './controllers/user.controller';
import { PermissionController } from './controllers/permission.controller';
import { APP_PIPE } from '@nestjs/core';
import { StudentController } from './controllers/club/student.controller';
import { Services } from '../common/enums/services.enum';
import { AuthGuard } from '../common/guards/auth.guard';
import { CoachController } from './controllers/club/coach.controller';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    ClientsModule.register([
      {
        name: Services.AUTH,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_AUTH_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
        },
      },
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
        },
      },
      {
        name: Services.PERMISSION,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_PERMISSION_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
        },
      },
      {
        name: Services.CLUB,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_CLUB_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
        },
      },
    ]),
  ],
  controllers: [AuthController, UserController, StudentController, CoachController, PermissionController],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true }),
    },
    AuthGuard,
    AuthController,
    UserController,
  ],
})
export class GatewayModule {}
