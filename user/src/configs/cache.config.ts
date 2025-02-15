import { createKeyv } from "@keyv/redis";
import { CacheModuleOptions } from "@nestjs/cache-manager";

export const cacheConfig = (): CacheModuleOptions => {
    console.log(process.env.REDIS_HOST )
    return {
        isGlobal: true,
        stores: [
            createKeyv({
                password: process.env.REDIS_PASSWORD,
                socket: {
                    host: process.env.REDIS_HOST,
                    port: +process.env.REDIS_PORT
                }
            })]
    }
};