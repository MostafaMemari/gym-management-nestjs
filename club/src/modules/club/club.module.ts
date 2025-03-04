import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Services } from '../../common/enums/services.enum';
import { ClubEntity } from './entities/club.entity';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { CacheModule } from '../cache/cache.module';
import { CoachModule } from '../coach/coach.module';
import { ClubRepository } from './repositories/club.repository';
import { ClubSubscriber } from './subscribers/club.subscriber';

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
    TypeOrmModule.forFeature([ClubEntity]),
    CacheModule,
    forwardRef(() => CoachModule),
  ],
  controllers: [ClubController],
  providers: [ClubService, ClubRepository, ClubSubscriber],
  exports: [ClubService],
})
export class ClubModule {}
