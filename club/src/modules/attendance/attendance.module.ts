import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../cache/cache.module';
import { SessionModule } from '../session/session.module';
import { StudentModule } from '../student/student.module';

import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AttendanceSessionEntity } from './entities/attendance-sessions.entity';
import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceSessionRepository } from './repositories/attendance-sessions.repository';
import { AttendanceRepository } from './repositories/attendance.repository';
import { AttendanceSubscriber } from './subscribers/attendance.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, AttendanceSessionEntity]), CacheModule, StudentModule, SessionModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, AttendanceSessionRepository, AttendanceSubscriber],
  exports: [AttendanceService],
})
export class AttendanceModule {}
