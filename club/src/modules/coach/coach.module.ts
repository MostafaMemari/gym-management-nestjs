import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';
import { AwsModule } from '../s3AWS/s3AWS.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachEntity } from './entities/coach.entity';
import { CoachRepository } from './repositories/coach.repository';
import { CoachSubscriber } from './subscribers/coach.subscriber';

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
    TypeOrmModule.forFeature([CoachEntity]),
    CacheModule,
    AwsModule,
  ],
  controllers: [CoachController],
  providers: [CoachService, CoachRepository, CoachSubscriber],
  exports: [CoachService],
})
export class CoachModule {}
