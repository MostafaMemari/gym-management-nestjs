import { NestFactory } from '@nestjs/core';
import { UserModule } from './user.module';
import { Logger } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(UserModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME
    }
  } as RmqOptions);

  const logger = new Logger("NestApplication")

  await app.listen()
  logger.log("User service is running....")
}
bootstrap();
