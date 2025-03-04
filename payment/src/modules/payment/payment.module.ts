import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { HttpApiModule } from '../http/http.module';

@Module({
  imports: [ConfigModule.forRoot(envConfig()),HttpApiModule],
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
