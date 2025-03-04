import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgeCategoryController } from './age-category.controller';
import { AgeCategoryService } from './age-category.service';
import { AgeCategoryEntity } from './entities/age-category.entity';
import { AgeCategoryRepository } from './repositories/age-category.repository';
import { AgeCategorySubscriber } from './subscribers/age-category.subscriber';

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
    TypeOrmModule.forFeature([AgeCategoryEntity]),
    CacheModule,
  ],
  controllers: [AgeCategoryController],
  providers: [AgeCategoryService, AgeCategoryRepository, AgeCategorySubscriber],
  exports: [AgeCategoryService, AgeCategoryRepository],
})
export class AgeCategoryModule {}
