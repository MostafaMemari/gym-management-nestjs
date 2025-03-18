import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import configModuleOptions from './common/validation/env.validation';
import { typeOrmConfigAsync } from './configs/typeorm.config';

@Module({
  imports: [ConfigModule.forRoot(configModuleOptions()), TypeOrmModule.forRootAsync(typeOrmConfigAsync)],
  controllers: [],
  providers: [],
})
export class AppModule {}
