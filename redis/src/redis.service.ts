import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisMessages } from './enums/redis.messages';
import { ISet } from './interfaces/redis.interface';
import { ServiceResponse } from './interfaces/serviceResponse.interface';

@Injectable()
export class RedisService {
    constructor(@InjectRedis() private readonly redis: Redis) { }

    async get(data: { key: string }): Promise<ServiceResponse> {
        const value = await this.redis.get(data.key)

        if (!value) {
            return {
                data: {},
                error: true,
                message: RedisMessages.NotFound,
                status: HttpStatus.NOT_FOUND
            }
        }

        return {
            data: { value },
            error: false,
            message: "",
            status: HttpStatus.OK
        }
    }

    async set(data: ISet): Promise<ServiceResponse> {
        const value = await this.redis.set(data.key, data.value, "EX", data.expireTime)

        return {
            data: {},
            error: false,
            message: value,
            status: HttpStatus.CREATED
        }
    }

}
