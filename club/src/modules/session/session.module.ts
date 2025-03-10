import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Services } from '../../common/enums/services.enum';
import { SessionEntity } from './entities/session.entity';
import { SessionController } from './session.controller';
import { SessionService } from './session.service';
import { CacheModule } from '../cache/cache.module';
import { CoachModule } from '../coach/coach.module';
import { SessionRepository } from './repositories/session.repository';
import { SessionSubscriber } from './subscribers/session.subscriber';
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
    TypeOrmModule.forFeature([SessionEntity]),
    ClubModule,
    CacheModule,
    StudentModule,
  ],
  controllers: [SessionController],
  providers: [SessionService, SessionRepository, SessionSubscriber],
  exports: [SessionService],
})
export class SessionModule {}
