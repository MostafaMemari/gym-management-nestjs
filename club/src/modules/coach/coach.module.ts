import { forwardRef, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Services } from '../../common/enums/services.enum';
import { CacheModule } from '../cache/cache.module';
import { AwsModule } from '../s3AWS/s3AWS.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachEntity } from './entities/coach.entity';
import { CoachRepository } from './repositories/coach.repository';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GymModule } from '../gym/gym.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: Services.USER,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_USER_QUEUE_NAME'),
          },
        }),
      },
    ]),
    TypeOrmModule.forFeature([CoachEntity]),
    CacheModule,
    AwsModule,
    forwardRef(() => GymModule),
    StudentModule,
  ],
  controllers: [CoachController],
  providers: [CoachService, CoachRepository],
  exports: [CoachService],
})
export class CoachModule {}
