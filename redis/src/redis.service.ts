import { InjectRedis } from '@nestjs-modules/ioredis';
import { HttpStatus, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { RedisMessages } from './common/enums/redis.messages';
import { ISet } from './common/interfaces/redis.interface';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { RpcException } from '@nestjs/microservices';

@Injectable()
export class RedisService {
    constructor(@InjectRedis() private readonly redis: Redis) { }

    async get(data: { key: string }): Promise<ServiceResponse> {
        try {
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
        } catch (error) {
            throw new RpcException(error)
        }

    }

    async set(data: ISet): Promise<ServiceResponse> {
        try {
            const value = await this.redis.set(data.key, data.value, "EX", data.expireTime || -1)

            return {
                data: {},
                error: false,
                message: value,
                status: HttpStatus.CREATED
            }
        } catch (error) {
            throw new RpcException(error)
        }
    }

    async del(data: { key: string }): Promise<ServiceResponse> {
        try {
            const value = await this.redis.del(data.key);

            if (value == 0) {
                return {
                    data: {},
                    error: true,
                    message: RedisMessages.NotFound,
                    status: HttpStatus.NOT_FOUND
                }
            }

            return {
                data: {},
                error: false,
                message: RedisMessages.DeletedValueSuccess,
                status: HttpStatus.OK
            }
        } catch (error) {
            throw new RpcException(error)
        }

    }
}
