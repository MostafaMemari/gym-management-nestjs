import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BeltExamController } from './belt-exam.controller';
import { BeltExamService } from './belt-exam.service';
import { BeltExamEntity } from './entities/belt-exam.entity';
import { BeltExamRepository } from './repositories/belt-exam.repository';
import { BeltExamSubscriber } from './subscribers/belt-exam.subscriber';

import { CacheModule } from '../cache/cache.module';
import { BeltModule } from '../belt/belt.module';

@Module({
  imports: [TypeOrmModule.forFeature([BeltExamEntity]), CacheModule, BeltModule],
  controllers: [BeltExamController],
  providers: [BeltExamService, BeltExamRepository, BeltExamSubscriber],
  exports: [BeltExamService, BeltExamRepository],
})
export class BeltExamModule {}
