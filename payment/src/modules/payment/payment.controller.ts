import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentPatterns } from '../../common/enums/payment.events';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(PaymentPatterns.CreateGatewayUrl)
  gatewayUrl(@Payload() data: any) {
    this.paymentService.getGatewayUrl(data);
  }

  @MessagePattern(PaymentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }
}
