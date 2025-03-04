import { Controller, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';

@Controller('payment')
@ApiTags('payment')
export class PaymentController {
  constructor(@Inject(Services.PAYMENT) private readonly paymentServiceClient: ClientProxy) {}
}
