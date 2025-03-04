import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { RmqOptions, Transport } from '@nestjs/microservices';
import { CustomRpcException } from './common/filters/rpeException.filter';
import { PaymentModule } from './modules/payment/payment.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(PaymentModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME,
    },
  } as RmqOptions);

  const logger = new Logger('NestApplication');

  app.useGlobalFilters(new CustomRpcException());

  await app.listen();
  logger.log('Payment service is running....');
}
bootstrap();
