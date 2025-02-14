import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { Logger } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { CustomRpcException } from './common/filters/rpcException.filter';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AuthModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME
    }
  } as RmqOptions);

  app.useGlobalFilters(new CustomRpcException())

  const logger = new Logger("NestApplication")

  await app.listen()
  logger.log("Auth service is running....")
}
bootstrap();
