import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';
import { ClubModule } from '../club/club.module';
import { CoachModule } from '../coach/coach.module';
import { AwsModule } from '../s3AWS/s3AWS.module';
import { StudentEntity } from './entities/student.entity';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { StudentSubscriber } from './subscribers/student.subscriber';
import { StudentRepository } from './repositories/student.repository';

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
    TypeOrmModule.forFeature([StudentEntity]),
    CacheModule,
    AwsModule,
    CoachModule,
    ClubModule,
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository, StudentSubscriber],
  exports: [],
})
export class StudentModule {}
