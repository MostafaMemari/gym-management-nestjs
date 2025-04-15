import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './app/gateway.module';
import { Logger } from '@nestjs/common';
import { swaggerConfigInit } from './configs/swagger.config';
import { BasicAuthMiddleware } from './common/middlewares/basicAuth.middleware';
import * as express from 'express';
import { RoleController } from './app/controllers/user/role.controller';

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule, {
    logger: process.env.NODE_ENV === 'production' ? ['log', 'warn', 'error'] : ['log', 'warn', 'debug', 'error', 'verbose', 'fatal'],
  });

  const logger = new Logger('NestApplication');

  const { PORT = 4000 } = process.env;

  if (process.env.NODE_ENV == 'production') {
    const syncService = app.get(RoleController);
    await syncService.syncStaticRoles();
  }

  app.use(new BasicAuthMiddleware().use);

  app.setGlobalPrefix('api/v1');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  swaggerConfigInit(app);

  await app.listen(PORT);
  logger.log(`Application running on port ${PORT}`);
}
bootstrap();
