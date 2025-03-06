import { BadRequestException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { ZarinpalService } from '../http/zarinpal.service';
import { RpcException } from '@nestjs/microservices';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IVerifyPayment } from 'src/common/interfaces/payment.interface';
import { PaymentRepository } from './payment.repository';
import { TransactionStatus } from '@prisma/client';
import { ServiceResponse } from 'src/common/interfaces/serviceResponse.interface';

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

      return {
        data: { authority, code, gatewayURL },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verify(data: IVerifyPayment) {
    try {
      const { authority, status } = data;
      let redirectUrl = `${data.frontendUrl}?status=success`;

      let payment = await this.paymentRepository.findOneByArgs({ authority });

      //TODO: Add message to enum
      if (!payment) throw new NotFoundException('Payment not found');

      //TODO: Add message to enum
      if (payment.status == TransactionStatus.SUCCESS || payment.status == TransactionStatus.FAILED)
        throw new BadRequestException('Failed or already verified payment');

      const merchantId = process.env.ZARINPAL_MERCHANT_ID;

      const { code } = await this.zarinpalService.verifyRequest({ authority, merchant_id: merchantId, amount: payment.amount });

      if (status !== 'OK' || code !== 100) {
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.FAILED });
        redirectUrl = `${data.frontendUrl}?status=failed`;
      } else {
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.SUCCESS });
      }

      return {
        data: { redirectUrl, payment },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async findUserTransaction({ userId }: { userId: number }): Promise<ServiceResponse> {
    try {
      const payments = await this.paymentRepository.findByArgs({ userId });

      return {
        data: { payments },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }

  findOneTransaction() {}

  findAllTransaction() {}
}
