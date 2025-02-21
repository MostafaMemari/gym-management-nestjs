import { Module } from '@nestjs/common';
import { AwsService } from './s3AWS.service';

@Module({
  providers: [AwsService],
  exports: [AwsService],
})
export class AwsModule {}
