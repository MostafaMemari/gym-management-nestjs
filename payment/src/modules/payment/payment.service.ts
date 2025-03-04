import { BadRequestException, HttpStatus, Injectable } from '@nestjs/common';
import { ZarinpalService } from '../http/zarinpal.service';
import { RpcException } from '@nestjs/microservices';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IVerifyPayment } from 'src/common/interfaces/payment.interface';

@Injectable()
export class PaymentService {
  constructor(private readonly zarinpalService: ZarinpalService) {}

  async getGatewayUrl(data: ISendRequest) {
    try {
      const { authority, code, gatewayURL } = await this.zarinpalService.sendRequest({
        amount: data.amount,
        description: data.description,
        user: data?.user,
      });

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

  verify(data: IVerifyPayment) {
    try {
      const { authority, status } = data;
      let redirectUrl = `${data.frontendUrl}?status=success`;

      if (status !== 'OK') redirectUrl = `${data.frontendUrl}?status=failed`;

      return {
        data: { redirectUrl },
        error: false,
        message: '',
        status: HttpStatus.OK,
      };
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
