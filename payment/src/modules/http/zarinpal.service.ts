import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ISendRequest, IVerifyRequest } from '../../common/interfaces/http.interface';
import { RpcException } from '@nestjs/microservices';
import { catchError, lastValueFrom, map } from 'rxjs';

@Injectable()
export class ZarinpalService {
  constructor(private readonly httpService: HttpService) { }

  async sendRequest(data: Omit<ISendRequest, "userId">) {
    try {
      const { amount, description, user, callbackUrl } = data;

      const options = {
        merchant_id: process.env.ZARINPAL_MERCHANT_ID,
        amount: amount,
        description,
        metadata: {
          email: user?.email ?? 'example@gmail.com',
          mobile: user?.mobile ?? '',
        },
        callback_url: callbackUrl ?? process.env.ZARINPAL_CALLBACK_URL,
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

  async verifyRequest(data: IVerifyRequest) {
    const { authority, merchant_id, amount } = data;

    const options = {
      authority,
      amount,
      merchant_id,
    };

    const verifyURL = process.env.ZARINPAL_VERIFY_URL;

    const result = await lastValueFrom(
      this.httpService
        .post(verifyURL, options)
        .pipe(map((res) => res.data))
        .pipe(
          catchError((err) => {
            throw new InternalServerErrorException('Zarinpal failed');
          }),
        ),
    );

    return { code: result.data.code, message: result.data.message };
  }
}
