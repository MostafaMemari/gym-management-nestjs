import { NestFactory } from '@nestjs/core';
import { RedisModule } from './redis.module';
import { Logger } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { CustomRpcException } from './common/filters/rpcException.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(RedisModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME
    }
  } as RmqOptions);

  const logger = new Logger("NestApplication")

  app.useGlobalFilters(new CustomRpcException())

  await app.listen()
  logger.log("Redis service is running....")
}
bootstrap();
