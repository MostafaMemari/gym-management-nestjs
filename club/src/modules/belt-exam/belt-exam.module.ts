import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BeltExamController } from './belt-exam.controller';
import { BeltExamService } from './belt-exam.service';
import { BeltExamEntity } from './entities/belt-exam.entity';
import { BeltExamRepository } from './repositories/belt-exam.repository';
import { BeltExamSubscriber } from './subscribers/belt-exam.subscriber';

import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';
import { BeltModule } from '../belt/belt.module';

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
    TypeOrmModule.forFeature([BeltExamEntity]),
    CacheModule,
    BeltModule,
  ],
  controllers: [BeltExamController],
  providers: [BeltExamService, BeltExamRepository, BeltExamSubscriber],
  exports: [BeltExamService, BeltExamRepository],
})
export class BeltExamModule {}
