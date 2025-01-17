import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { Services } from '../common/enums/services.enum';
import { AuthController } from './controllers/auth.controller';

@Module({
  imports: [
    ClientsModule.register([
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
          queueOptions: {
            durable: false,
          }
        }
      }
    ])
  ],
  controllers: [AuthController],
  providers: [],
})
export class AppModule { }
