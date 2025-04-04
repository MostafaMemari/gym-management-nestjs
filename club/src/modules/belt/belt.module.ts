import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BeltController } from './belt.controller';
import { BeltService } from './belt.service';
import { BeltEntity } from './entities/belt.entity';
import { BeltRepository } from './repositories/belt.repository';
import { BeltSubscriber } from './subscribers/belt.subscriber';

import { CacheModule } from '../cache/cache.module';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from 'src/common/enums/services.enum';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: Services.ACADEMY,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [configService.get<string>('RABBITMQ_URL')],
            queue: configService.get<string>('RABBITMQ_ACADEMY_QUEUE_NAME'),
          },
        }),
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
