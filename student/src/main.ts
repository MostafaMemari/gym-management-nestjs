import { NestFactory } from "@nestjs/core";
import { StudentModule } from "./student.module";
import { Logger } from "@nestjs/common";
import { RmqOptions, Transport } from "@nestjs/microservices";
import { CustomRpcExceptionFilter } from "./common/filters/rpcException.filter";

async function bootstrap() {
  const app = await NestFactory.createMicroservice(StudentModule, {
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_QUEUE_NAME,
    },
  } as RmqOptions);

  app.useGlobalFilters(new CustomRpcExceptionFilter())

  const logger = new Logger("NestApplication");

  await app.listen();
  logger.log("Student service is running....");
}
bootstrap();
