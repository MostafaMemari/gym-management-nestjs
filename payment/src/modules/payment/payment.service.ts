import { BadRequestException, HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ZarinpalService } from '../http/zarinpal.service';
import { RpcException } from '@nestjs/microservices';
import { ISendRequest } from '../../common/interfaces/http.interface';
import { IPagination, IVerifyPayment } from '../../common/interfaces/payment.interface';
import { PaymentRepository } from './payment.repository';
import { Transaction, TransactionStatus } from '@prisma/client';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { ResponseUtil } from '../../common/utils/response.utils';
import { PaymentMessages } from '../../common/enums/payment.messages';
import { CacheService } from '../cache/cache.service';
import { pagination } from '../../common/utils/pagination.utils';
import { CacheKeys } from '../../common/enums/cache.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class PaymentService {
  private logger = new Logger(PaymentService.name);
  private REDIS_EXPIRE_TIME = 600; //* Seconds

  constructor(
    private readonly zarinpalService: ZarinpalService,
    private readonly paymentRepository: PaymentRepository,
    private readonly cacheService: CacheService,
  ) {}

  @Cron(CronExpression.EVERY_12_HOURS)
  async handelStaleTransactions() {
    try {
      this.logger.log('Checking for expired transactions...');

      const transactions = await this.paymentRepository.findByArgs({}, { where: { status: TransactionStatus.PENDING } });

      const now = new Date();
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      transactions.forEach(async (transaction) => {
        if (new Date(transaction.createdAt) < twentyFourHoursAgo) {
          await this.paymentRepository.update(transaction.id, { status: TransactionStatus.FAILED });
          this.logger.warn(`Transaction ${transaction.id} marked as FAILED due to timeout.`);
        }
      });

      this.logger.log('Expired transactions processing completed.');
    } catch (error) {
      this.logger.error(`Error processing stale transactions: ${error.message}`, error.stack);
    }
  }

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
    let payment: null | Transaction = null;
    try {
      const { authority, status } = data;
      let redirectUrl = `${data.frontendUrl}?status=success`;

      payment = await this.findOneOrThrow({ authority });

      if (payment.status !== TransactionStatus.PENDING) throw new BadRequestException(PaymentMessages.FailedOrVerified);

      const merchantId = process.env.ZARINPAL_MERCHANT_ID;

      const { code } = await this.zarinpalService.verifyRequest({ authority, merchant_id: merchantId, amount: payment.amount });

      if (status !== 'OK' || code !== 100) {
        redirectUrl = `${data.frontendUrl}?status=failed`;
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.FAILED });
      } else {
        payment = await this.paymentRepository.update(payment.id, { status: TransactionStatus.SUCCESS });
      }

      return ResponseUtil.success({ redirectUrl, payment }, PaymentMessages.VerifiedSuccess, HttpStatus.OK);
    } catch (error) {
      if (payment?.id && payment.status === TransactionStatus.PENDING) {
        await this.paymentRepository.update(payment.id, { status: TransactionStatus.FAILED });
      }
      throw new RpcException(error);
    }
  }

  async findUserTransactions({ userId, ...paginationDto }: IPagination & { userId: number }): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.Transaction}_${paginationDto.page || 1}_${paginationDto.take || 20}_${userId}`;

      const cacheData = await this.cacheService.get<null | Transaction[]>(cacheKey);

      if (cacheData) {
        return ResponseUtil.success({ ...pagination(paginationDto, cacheData) }, '', HttpStatus.OK);
      }

      const transactions = await this.paymentRepository.findByArgs({ userId });

      await this.cacheService.set(cacheKey, transactions, this.REDIS_EXPIRE_TIME);

      return ResponseUtil.success({ transactions: pagination(paginationDto, transactions) }, '', HttpStatus.OK);
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

  async findTransactions(paginationDto: IPagination): Promise<ServiceResponse> {
    try {
      const cacheKey = `${CacheKeys.Transaction}_${paginationDto.page || 1}_${paginationDto.take || 20}`;

      const cacheData = await this.cacheService.get<null | Transaction[]>(cacheKey);

      if (cacheData) {
        return ResponseUtil.success({ ...pagination(paginationDto, cacheData) }, '', HttpStatus.OK);
      }

      const transactions = await this.paymentRepository.findByArgs();

      await this.cacheService.set(cacheKey, transactions, this.REDIS_EXPIRE_TIME);

      return ResponseUtil.success({ transactions: pagination(paginationDto, transactions) }, '', HttpStatus.OK);
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
