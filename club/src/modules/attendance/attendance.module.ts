import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AttendanceEntity } from './entities/attendance.entity';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { CacheModule } from '../cache/cache.module';
import { AttendanceRepository } from './repositories/attendance.repository';
import { AttendanceSubscriber } from './subscribers/attendance.subscriber';
import { StudentModule } from '../student/student.module';
import { ClubModule } from '../club/club.module';
import { AttendanceSessionEntity } from './entities/attendance-sessions.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AttendanceEntity, AttendanceSessionEntity]), ClubModule, CacheModule, StudentModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AttendanceRepository, AttendanceSubscriber],
  exports: [AttendanceService],
})
export class AttendanceModule {}
