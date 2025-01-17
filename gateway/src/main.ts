import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/gateway.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('NestApplication')

  const { PORT = 4000 } = process.env

  await app.listen(PORT);
  logger.log(`Application running on port ${PORT}`)
}
bootstrap();
