import { Module, ValidationPipe } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AuthController } from './controllers/auth/auth.controller';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../configs/env.config';
import { UserController } from './controllers/user.controller';
import { APP_PIPE } from '@nestjs/core';
import { StudentController } from './controllers/club/student.controller';
import { Services } from '../common/enums/services.enum';
import { AuthGuard } from '../common/guards/auth.guard';
import { CoachController } from './controllers/club/coach.controller';
import { ClubController } from './controllers/club/club.controller';
import { RbacController } from './controllers/auth/rbac.controller';
import { NotificationController } from './controllers/notification.controller';
import { BeltController } from './controllers/club/belt.controller';

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
          queueOptions: {
            // durable: process.env.NODE_ENV == 'production',
          },
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
          queueOptions: {
            // durable: process.env.NODE_ENV == 'production',
          },
        },
      },
      {
        name: Services.NOTIFICATION,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_NOTIFICATION_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
          queueOptions: {
            // durable: process.env.NODE_ENV == 'production',
          },
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
          queueOptions: {
            // durable: process.env.NODE_ENV == 'production',
          },
        },
      },
      {
        name: Services.PAYMENT,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_PAYMENT_SERVICE_QUEUE,
          prefetchCount: 2,
          isGlobalPrefetchCount: true,
          noAck: true,
          persistent: false,
          queueOptions: {
            // durable: process.env.NODE_ENV == 'production',
          },
        },
      },
    ]),
  ],
  controllers: [
    AuthController,
    RbacController,
    UserController,
    NotificationController,
    StudentController,
    CoachController,
    ClubController,
    BeltController,
  ],
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
