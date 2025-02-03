import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
    constructor(@InjectRedis() private readonly redis: Redis) { }

    async get(data: { key: string }) {
        const value = await this.redis.get(data.key)

        if (!value) {
            return {
                data: {},
                error: true,
                message: "",
                status: HttpStatus.NOT_FOUND
            }
        }

        return {
            data: { value }
        }
    }
}
