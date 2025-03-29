import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GymEntity } from './entities/gym.entity';
import { GymController } from './gym.controller';
import { GymService } from './gym.service';
import { GymRepository } from './repositories/gym.repository';

import { CacheModule } from '../cache/cache.module';
import { CoachModule } from '../coach/coach.module';
import { GymSubscriber } from './subscribers/gym.subscriber';

@Module({
  imports: [TypeOrmModule.forFeature([GymEntity]), CacheModule, forwardRef(() => CoachModule)],
  controllers: [GymController],
  providers: [GymService, GymRepository, GymSubscriber],
  exports: [GymService],
})
export class GymModule {}
