import { Controller } from '@nestjs/common';
import { RedisService } from './redis.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RedisPatterns } from './common/enums/redis.events';
import { ISet } from './common/interfaces/redis.interface';

@Controller()
export class RedisController {
  constructor(private readonly redisService: RedisService) { }

  @MessagePattern(RedisPatterns.Get)
  get(@Payload() data: { key: string }) {
    return this.redisService.get(data)
  }

  @MessagePattern(RedisPatterns.Set)
  set(@Payload() data: ISet) {
    return this.redisService.set(data)
  }

  @MessagePattern(RedisPatterns.Del)
  del(@Payload() data: { key: string }) {
    return this.redisService.del(data)
  }

  @MessagePattern(RedisPatterns.CheckConnection)
  checkConnection() {
    return true
  }
}
