import { ClientsModule, Transport } from "@nestjs/microservices";
import { Services } from "src/common/enums/services.enum";

export const RmqClientsModule = ClientsModule.register([
  {
    name: Services.AUTH,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_AUTH_SERVICE_QUEUE,
      prefetchCount: 2,
      isGlobalPrefetchCount: true,
      noAck: true,
      persistent: false,
    },
  },
  {
    name: Services.USER,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_USER_SERVICE_QUEUE,
      prefetchCount: 2,
      isGlobalPrefetchCount: true,
      noAck: true,
      persistent: false,
    },
  },
  {
    name: Services.PERMISSION,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_PERMISSION_SERVICE_QUEUE,
      prefetchCount: 2,
      isGlobalPrefetchCount: true,
      noAck: true,
      persistent: false,
    },
  },
  {
    name: Services.REDIS,
    transport: Transport.RMQ,
    options: {
      urls: [process.env.RABBITMQ_URL],
      queue: process.env.RABBITMQ_REDIS_SERVICE_QUEUE,
      prefetchCount: 2,
      isGlobalPrefetchCount: true,
      noAck: true,
      persistent: false,
    },
  },
]);
