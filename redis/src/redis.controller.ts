import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MessagePattern } from '@nestjs/microservices';
import { RedisPatterns } from './enums/redis.events';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) { }

  @MessagePattern(RedisPatterns.CheckConnection)
  checkConnection() {
    return true
  }
}
