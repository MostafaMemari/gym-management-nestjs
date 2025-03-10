import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { SessionEntity } from './entities/session.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { CacheModule } from '../cache/cache.module';
import { SessionRepository } from './repositories/session.repository';
import { SessionSubscriber } from './subscribers/session.subscriber';
import { StudentModule } from '../student/student.module';
import { ClubModule } from '../club/club.module';

@Module({
  imports: [TypeOrmModule.forFeature([SessionEntity]), ClubModule, CacheModule, StudentModule],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository, SessionSubscriber],
  exports: [SessionService],
})
export class SessionModule {}
