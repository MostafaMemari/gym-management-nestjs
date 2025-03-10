import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Services } from '../../common/enums/services.enum';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { CacheModule } from '../cache/cache.module';
import { CoachModule } from '../coach/coach.module';
import { AttendanceRepository } from './repositories/attendance.repository';
import { AttendanceSubscriber } from './subscribers/attendance.subscriber';
import { StudentModule } from '../student/student.module';
import { ClubModule } from '../club/club.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: Services.USER,
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_USER_QUEUE_NAME,
        },
      },
    ]),
    TypeOrmModule.forFeature([AttendanceEntity]),
    ClubModule,
    CacheModule,
    StudentModule,
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, AttendanceSubscriber],
  exports: [AttendanceService],
})
export class AttendanceModule {}
