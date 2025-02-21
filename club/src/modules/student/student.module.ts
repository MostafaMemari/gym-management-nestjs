import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule, Transport } from '@nestjs/microservices';

import { Services } from '../../common/enums/services.enum';
import { CacheService } from '../cache/cache.service';
import { AwsService } from '../s3AWS/s3AWS.service';
import { StudentEntity } from './entities/student.entity';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { CacheModule } from '../cache/cache.module';
import { AwsModule } from '../s3AWS/s3AWS.module';
import { ClubService } from '../club/club.service';
import { CoachService } from '../coach/coach.service';
import { CoachModule } from '../coach/coach.module';
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
    TypeOrmModule.forFeature([StudentEntity]),
    CacheModule,
    AwsModule,
    CoachModule,
    ClubModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
  exports: [],
})
export class StudentModule {}
