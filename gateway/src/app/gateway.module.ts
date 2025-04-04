import { APP_PIPE } from '@nestjs/core';
import { Module, ValidationPipe } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';

import envConfig from '../configs/env.config';
import { Services } from '../common/enums/services.enum';
import { AuthGuard } from '../common/guards/auth.guard';

import { AuthController } from './controllers/auth/auth.controller';
import { UserController } from './controllers/user/user.controller';
import { StudentController } from './controllers/club/student.controller';
import { CoachController } from './controllers/club/coach.controller';
import { GymController } from './controllers/club/gym.controller';
import { RbacController } from './controllers/auth/rbac.controller';
import { NotificationController } from './controllers/notification.controller';
import { BeltController } from './controllers/club/belt.controller';
import { AgeCategoryController } from './controllers/club/age-category.controller';
import { PaymentController } from './controllers/payment.controller';
import { BeltExamController } from './controllers/club/belt-exams.controller';
import { WalletController } from './controllers/user/wallet.controller';
import { SessionController } from './controllers/club/session.controller';
import { AttendanceController } from './controllers/club/attendance.controller';
import { LessonController } from './controllers/academy/lesson.controller';
import { CoursesController } from './controllers/academy/course.controller';
import { ChaptersController } from './controllers/academy/chapter.controller';
import { AwsModule } from '../modules/s3AWS/s3AWS.module';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig()),
    AwsModule,
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
      {
        name: Services.ACADEMY,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_ACADEMY_SERVICE_QUEUE,
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
    WalletController,
    PaymentController,
    NotificationController,
    StudentController,
    CoachController,
    GymController,
    BeltController,
    AgeCategoryController,
    BeltExamController,
    SessionController,
    AttendanceController,
    CoursesController,
    LessonController,
    ChaptersController,
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
