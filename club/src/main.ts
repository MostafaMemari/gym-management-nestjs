import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { CustomRpcExceptionFilter } from './common/filters/rpcException.filter';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME,
    },
  } as RmqOptions);

  app.useGlobalFilters(new CustomRpcExceptionFilter());

  const logger = new Logger('NestApplication');

  await app.listen();
  logger.log('Club service is running....');
}
bootstrap();
