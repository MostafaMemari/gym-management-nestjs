import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configModuleOptions from './common/validation/env.validation';
import { typeOrmConfigAsync } from './configs/typeorm.config';
import { CoachModule } from './modules/coach/coach.module';
import { StudentModule } from './modules/student/student.module';
import { GymModule } from './modules/gym/gym.module';
import { BeltModule } from './modules/belt/belt.module';
import { BeltExamModule } from './modules/belt-exam/belt-exam.module';
import { SessionModule } from './modules/session/session.module';
import { AttendanceModule } from './modules/attendance/attendance.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions()),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    StudentModule,
    CoachModule,
    GymModule,
    BeltModule,
    BeltExamModule,
    SessionModule,
    AttendanceModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
