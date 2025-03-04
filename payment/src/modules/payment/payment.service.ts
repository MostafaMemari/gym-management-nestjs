import { HttpStatus, Injectable } from '@nestjs/common';
import { ZarinpalService } from '../http/zarinpal.service';
import { RpcException } from '@nestjs/microservices';
import { ISendRequest } from '../../common/interfaces/http.interface';

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
}
