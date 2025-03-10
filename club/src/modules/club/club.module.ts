import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ClubEntity } from './entities/club.entity';
import { ClubController } from './club.controller';
import { ClubService } from './club.service';
import { ClubRepository } from './repositories/club.repository';
import { ClubSubscriber } from './subscribers/club.subscriber';

import { CacheModule } from '../cache/cache.module';
import { CoachModule } from '../coach/coach.module';

@Module({
  imports: [TypeOrmModule.forFeature([ClubEntity]), CacheModule, forwardRef(() => CoachModule)],
  controllers: [ClubController],
  providers: [ClubService, ClubRepository, ClubSubscriber],
  exports: [ClubService],
})
export class ClubModule {}
