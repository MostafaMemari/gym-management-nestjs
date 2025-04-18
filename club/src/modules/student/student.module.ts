import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StudentBeltEntity } from './entities/student-belt.entity';
import { StudentEntity } from './entities/student.entity';
import { StudentBeltRepository } from './repositories/student-belt.repository';
import { StudentRepository } from './repositories/student.repository';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';

import { AgeCategoryModule } from '../age-category/age-category.module';
import { BeltModule } from '../belt/belt.module';
import { CacheModule } from '../cache/cache.module';
import { GymModule } from '../gym/gym.module';
import { AwsModule } from '../s3AWS/s3AWS.module';

import { Services } from '../../common/enums/services.enum';

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
    TypeOrmModule.forFeature([StudentEntity, StudentBeltEntity]),
    AwsModule,
    CacheModule,
    GymModule,
    BeltModule,
    AgeCategoryModule,
  ],
  controllers: [StudentController],
  providers: [StudentService, StudentRepository, StudentBeltRepository],
  exports: [StudentService, StudentRepository],
})
export class StudentModule {}
