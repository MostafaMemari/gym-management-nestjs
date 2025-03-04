import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BeltController } from './belt.controller';
import { BeltService } from './belt.service';
import { BeltEntity } from './entities/belt.entity';
import { BeltRepository } from './repositories/belt.repository';
import { BeltSubscriber } from './subscribers/club.subscriber';

import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';

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
    TypeOrmModule.forFeature([BeltEntity]),
    CacheModule,
  ],
  controllers: [BeltController],
  providers: [BeltService, BeltRepository, BeltSubscriber],
  exports: [BeltService, BeltRepository],
})
export class BeltModule {}
