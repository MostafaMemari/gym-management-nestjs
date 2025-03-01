import { NestFactory } from '@nestjs/core';
import { NotificationModule } from './notification.module';
import { Logger } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(NotificationModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME
    }
  } as RmqOptions);

  const logger = new Logger("NestApplication")

  await app.listen()
  logger.log("Notification service is running....")
}
bootstrap();
