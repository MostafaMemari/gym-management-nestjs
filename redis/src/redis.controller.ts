import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RedisPatterns } from './enums/redis.events';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) { }

  @MessagePattern(RedisPatterns.Get)
  get(@Payload() data: { key: string }) {
    return this.redisService.get(data)
  }

  @MessagePattern(RedisPatterns.CheckConnection)
  checkConnection() {
    return true
  }
}
