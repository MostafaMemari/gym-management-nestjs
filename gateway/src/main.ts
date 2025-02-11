import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './app/gateway.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { swaggerConfigInit } from './configs/swagger.config';
import { BasicAuthMiddleware } from './common/middlewares/basicAuth.middleware';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const logger = new Logger('NestApplication');

  const { PORT = 4000 } = process.env;

  app.use(new BasicAuthMiddleware().use);

  app.setGlobalPrefix('api/v1');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  swaggerConfigInit(app);

  await app.listen(PORT);
  logger.log(`Application running on port ${PORT}`);
}
bootstrap();
