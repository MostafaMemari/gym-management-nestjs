import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class ZarinpalService {
  constructor(private readonly httpService: HttpService) {}

  async sendRequest(data: ISendRequest) {
    try {
      const { amount, description, user } = data;

      const options = {
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount: amount * 10,
        description,
        metadata: {
          email: user?.email ?? 'example@gmail.com',
          mobile: user?.mobile ?? '',
        },
        callback_url: process.env.ZARINPAL_CALLBACK_URL,
      };
      const requestURL = process.env.ZARINPAL_REQUEST_URL;

      const request = await lastValueFrom(
        this.httpService
          .post(requestURL, options)
          .pipe(map((res) => res.data))
          .pipe(
            catchError((err) => {
              throw new InternalServerErrorException('Zarinpal error');
            }),
          ),
      );

      const { authority, code } = request.data;

      if (code == 100 && authority) {
        return {
          code,
          authority,
          gatewayURL: `${process.env.ZARINPAL_GATEWAY_URL}/${authority}`,
        };
      }

      throw new BadRequestException('Connection failed in zarinpal');
    } catch (error) {
      throw new RpcException(error);
    }
  }
}
