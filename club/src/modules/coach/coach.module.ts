import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { AwsModule } from '../s3AWS/s3AWS.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachEntity } from './entities/coach.entity';
import { CacheModule } from '../cache/cache.module';
import { Services } from '../../common/enums/services.enum';

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
  providers: [CoachService],
  exports: [CoachService],
})
export class CoachModule {}
