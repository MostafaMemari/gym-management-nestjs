import { Controller } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { PaymentPatterns } from '../../common/enums/payment.events';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IGetUserTransactions, IPagination, IPaymentRefund, IVerifyPayment } from '../../common/interfaces/payment.interface';

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

  @MessagePattern(PaymentPatterns.RefundPayment)
  refundPayment(@Payload() data: IPaymentRefund) {
    return this.paymentService.refund(data);
  }

  @MessagePattern(PaymentPatterns.GetUserTransactions)
  getUserTransactions(@Payload() data: IGetUserTransactions) {
    return this.paymentService.findUserTransactions(data);
  }

  @MessagePattern(PaymentPatterns.GetOneTransaction)
  getOneTransaction(@Payload() data: { transactionId: number }) {
    return this.paymentService.findOneTransaction(data);
  }

  @MessagePattern(PaymentPatterns.GetTransactions)
  getTransactions(@Payload() data: IPagination) {
    return this.paymentService.findTransactions(data);
  }

  @MessagePattern(PaymentPatterns.CheckConnection)
  checkConnection() {
    return true;
  }
}
