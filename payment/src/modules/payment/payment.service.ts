import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ZarinpalService } from '../http/zarinpal.service';
import { RpcException } from '@nestjs/microservices';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IVerifyPayment } from '../../common/interfaces/payment.interface';
import { PaymentRepository } from './payment.repository';
import { Transaction, TransactionStatus } from '@prisma/client';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { PaymentMessages } from '../../common/enums/payment.messages';

@Injectable()
export class PaymentService {
  constructor(
    private readonly zarinpalService: ZarinpalService,
    private readonly paymentRepository: PaymentRepository,
  ) {}

  async getGatewayUrl(data: ISendRequest) {
    try {
      const { authority, code, gatewayURL } = await this.zarinpalService.sendRequest({
        amount: data.amount * 10,
        description: data.description,
        user: data?.user,
        callbackUrl: data.callbackUrl,
      });

      await this.paymentRepository.create({ amount: data.amount * 10, userId: data.userId, authority });

      return ResponseUtil.success({ authority, code, gatewayURL }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verify(data: IVerifyPayment) {
    try {
      const { authority, status } = data;
      let redirectUrl = `${data.frontendUrl}?status=success`;

      let payment = await this.findOneOrThrow({ authority });

      if (payment.status == TransactionStatus.SUCCESS || payment.status == TransactionStatus.FAILED)
        throw new BadRequestException(PaymentMessages.FailedOrVerified);

      const merchantId = process.env.ZARINPAL_MERCHANT_ID;

      const { code } = await this.zarinpalService.verifyRequest({ authority, merchant_id: merchantId, amount: payment.amount });

      if (status !== 'OK' || code !== 100) {
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.FAILED });
        redirectUrl = `${data.frontendUrl}?status=failed`;
      } else {
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.SUCCESS });
      }

      return ResponseUtil.success({ redirectUrl, payment }, PaymentMessages.VerifiedSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findUserTransaction({ userId }: { userId: number }): Promise<ServiceResponse> {
    try {
      const transactions = await this.paymentRepository.findByArgs({ userId });

      return ResponseUtil.success({ transactions }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findOneTransaction({ transactionId }: { transactionId: number }): Promise<ServiceResponse> {
    try {
      const transaction = await this.findOneOrThrow({ id: transactionId });

      return ResponseUtil.success({ transaction }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findAllTransaction(): Promise<ServiceResponse> {
    try {
      const transactions = await this.paymentRepository.findByArgs();

      return ResponseUtil.success({ transactions }, '', HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  private async findOneOrThrow(args: Partial<Transaction>): Promise<Transaction | never> {
    const transaction = await this.paymentRepository.findOneByArgs({ ...args });

    if (!transaction) throw new NotFoundException(PaymentMessages.NotFoundTransaction);

    return transaction;
  }
}
