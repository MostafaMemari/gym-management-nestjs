import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { ConfigModule } from '@nestjs/config';
import envConfig from '../../configs/env.config';
import { HttpApiModule } from '../http/http.module';
import { PaymentRepository } from './payment.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [ConfigModule.forRoot(envConfig()), HttpApiModule, PrismaModule, CacheModule],
  controllers: [PaymentController],
  providers: [PaymentService, PaymentRepository],
})
export class PaymentModule {}
