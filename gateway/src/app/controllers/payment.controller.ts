import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';
import { AuthDecorator } from '../../common/decorators/auth.decorator';
import { PaymentDto, QueryMyTransactionsDto, QueryTransactionsDto, RefundPaymentDto } from '../../common/dtos/payment.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { SwaggerConsumes } from '../../common/enums/swagger-consumes.enum';
import { lastValueFrom, timeout } from 'rxjs';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { PaymentPatterns } from '../../common/enums/payment.events';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/auth-user-service/role.enum';
import { AccessRole } from '../../common/decorators/accessRole.decorator';

@Controller('payment')
@ApiTags('payment')
@AuthDecorator()
export class PaymentController {
  private timeout = 5000;

  constructor(@Inject(Services.PAYMENT) private readonly paymentServiceClient: ClientProxy) {}

  @Post()
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async gatewayUrl(@Body() paymentDto: PaymentDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const paymentData = {
        ...paymentDto,
        user,
        userId: user.id,
      };

      const data = await lastValueFrom(this.paymentServiceClient.send(PaymentPatterns.CreateGatewayUrl, paymentData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get gateway url', Services.PAYMENT);
    }
  }

  @Get('verify')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async verifyPayment(@Query('Authority') authority: string, @Query('Status') status: string) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const verifyData = {
        authority,
        status,
        frontendUrl: process.env.PAYMENT_FRONTEND_URL,
      };

      const data = await lastValueFrom(this.paymentServiceClient.send(PaymentPatterns.VerifyPayment, verifyData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to verify payment', Services.PAYMENT);
    }
  }

  @Post('refund/:transactionId')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async refundPayment(@Param('transactionId', ParseIntPipe) transactionId: number, @Body() refundPaymentDto: RefundPaymentDto) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const result = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.RefundPayment, { transactionId, ...refundPaymentDto }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to refund payment', Services.PAYMENT);
    }
  }

  @Get('my/transactions')
  async getMyTransactions(@GetUser() user: User, @Query() transactionsFilters: QueryMyTransactionsDto) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const transactionsData = { userId: user.id, ...transactionsFilters };

      const data = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.GetUserTransactions, transactionsData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get your transactions', Services.PAYMENT);
    }
  }

  @Get('transactions')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async getTransactions(@Query() transactionFilterDto: QueryTransactionsDto) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const data = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.GetTransactions, transactionFilterDto).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get transactions', Services.PAYMENT);
    }
  }

  @Get('transaction/:id')
  @Roles(Role.SUPER_ADMIN)
  @AccessRole(Role.SUPER_ADMIN)
  async getOneTransaction(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const data = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.GetOneTransaction, { transactionIid: id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get transaction', Services.PAYMENT);
    }
  }
}
