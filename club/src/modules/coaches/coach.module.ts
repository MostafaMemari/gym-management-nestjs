import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AwsModule } from '../s3AWS/s3AWS.module';
import { CoachController } from './coach.controller';
import { CoachService } from './coach.service';
import { CoachEntity } from './entities/coach.entity';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([CoachEntity]), CacheModule, AwsModule],
  controllers: [CoachController],
  providers: [CoachService],
})
export class CoachModule {}
