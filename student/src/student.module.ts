import { Module } from '@nestjs/common';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { ConfigModule } from '@nestjs/config';

import { envValidationSchema } from './common/validation/env.validation';
import { TypeOrmModule } from '@nestjs/typeorm';
import { typeOrmConfigAsync } from './configs/typeorm.config';
import { StudentEntity } from './entities/student.entity';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from './common/enums/services.enum';
import { AwsModule } from './modules/s3AWS/s3AWS.module';
import { RedisCacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',
      validationSchema: envValidationSchema,
    }),
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
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    TypeOrmModule.forFeature([StudentEntity]),
    RedisCacheModule,
    AwsModule,
  ],
  controllers: [StudentController],
  providers: [StudentService],
})
export class StudentModule {}
