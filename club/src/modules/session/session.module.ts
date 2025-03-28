import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CacheModule } from '../cache/cache.module';
import { GymModule } from '../gym/gym.module';

import { StudentModule } from '../student/student.module';
import { SessionEntity } from './entities/session.entity';
import { SessionRepository } from './repositories/session.repository';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), GymModule, CacheModule, StudentModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository],
  exports: [SessionService],
})
export class SessionModule {}
