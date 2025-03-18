import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AgeCategoryController } from './age-category.controller';
import { AgeCategoryService } from './age-category.service';
import { AgeCategoryEntity } from './entities/age-category.entity';
import { AgeCategoryRepository } from './repositories/age-category.repository';
import { AgeCategorySubscriber } from './subscribers/age-category.subscriber';

import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [TypeOrmModule.forFeature([AgeCategoryEntity]), CacheModule],
  controllers: [AgeCategoryController],
  providers: [AgeCategoryService, AgeCategoryRepository, AgeCategorySubscriber],
  exports: [AgeCategoryService, AgeCategoryRepository],
})
export class AgeCategoryModule {}
