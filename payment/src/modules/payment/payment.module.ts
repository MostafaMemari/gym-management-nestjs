import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { HttpApiModule } from '../http/http.module';
import { PaymentRepository } from './payment.repository';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [ConfigModule.forRoot(envConfig()), HttpApiModule, PrismaModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
