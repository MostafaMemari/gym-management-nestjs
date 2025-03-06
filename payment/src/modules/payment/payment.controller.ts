import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentPatterns } from '../../common/enums/payment.events';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IVerifyPayment } from '../../common/interfaces/payment.interface';

@Controller()
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @MessagePattern(PaymentPatterns.CreateGatewayUrl)
  gatewayUrl(@Payload() data: ISendRequest) {
    return this.paymentService.getGatewayUrl(data);
  }

  @MessagePattern(PaymentPatterns.VerifyPayment)
  verifyPayment(@Payload() data: IVerifyPayment) {
    return this.paymentService.verify(data);
  }

  @MessagePattern(PaymentPatterns.GetUserPayments)
  getUserPayments(@Payload() data: { userId: number }) {
    return this.paymentService.findUserTransaction(data);
  }

  @MessagePattern(PaymentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }
}
