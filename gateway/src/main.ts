import { NestFactory } from "@nestjs/core";
import { GatewayModule } from "./app/gateway.module";
import { Logger } from "@nestjs/common";
import { swaggerConfigInit } from "./configs/swagger.config";
import { BasicAuthMiddleware } from "./common/middlewares/basicAuth.middleware";

async function bootstrap() {
  const app = await NestFactory.create(GatewayModule);
  const logger = new Logger("NestApplication");

  const { PORT = 4000 } = process.env;

  app.use(new BasicAuthMiddleware().use)

  swaggerConfigInit(app);

  await app.listen(PORT);
  logger.log(`Application running on port ${PORT}`);
}
bootstrap();
