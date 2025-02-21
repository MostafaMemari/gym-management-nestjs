import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Services } from './common/enums/services.enum';
import configModuleOptions from './common/validation/env.validation';
import { typeOrmConfigAsync } from './configs/typeorm.config';
import { CoachModule } from './modules/coaches/coach.module';
import { AwsModule } from './modules/s3AWS/s3AWS.module';
import { StudentModule } from './modules/students/student.module';
import { CacheModule } from './modules/cache/cache.module';

@Module({
  imports: [
    ConfigModule.forRoot(configModuleOptions()),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    StudentModule,
    // CoachModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
