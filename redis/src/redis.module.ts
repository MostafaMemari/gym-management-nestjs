import { Module } from '@nestjs/common';
import { RedisController } from './redis.controller';
import { RedisService } from './redis.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from './configs/env.config';

@Module({
  imports: [
    ConfigModule.forRoot(envConfig())
  ],
  controllers: [RedisController],
  providers: [RedisService],
})
export class RedisModule { }
