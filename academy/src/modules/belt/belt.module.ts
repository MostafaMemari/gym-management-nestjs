import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BeltController } from './belt.controller';
import { BeltService } from './belt.service';
import { BeltEntity } from './entities/belt.entity';
import { BeltRepository } from './repositories/belt.repository';
import { BeltSubscriber } from './subscribers/club.subscriber';

import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([BeltEntity]), CacheModule],
  controllers: [BeltController],
  providers: [BeltService, BeltRepository, BeltSubscriber],
  exports: [BeltService, BeltRepository],
})
export class BeltModule {}
