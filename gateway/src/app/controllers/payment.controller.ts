import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Services } from '../../common/enums/services.enum';
import { AuthDecorator } from '../../common/decorators/auth.decorator';
import { PaymentDto } from '../../common/dtos/payment.dto';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../common/interfaces/user.interface';
import { handleError, handleServiceResponse } from '../../common/utils/handleError.utils';
import { SwaggerConsumes } from '../../common/enums/swagger-consumes.enum';
import { lastValueFrom, timeout } from 'rxjs';
import { checkConnection } from '../../common/utils/checkConnection.utils';
import { PaymentPatterns } from '../../common/enums/payment.events';
import { Roles } from '../../common/decorators/role.decorator';
import { Role } from '../../common/enums/role.enum';

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
        frontendUrl: 'http://localhost:4000/api/v1/payment/success', //TODO: Add frontend url to env
      };

      const data = await lastValueFrom(this.paymentServiceClient.send(PaymentPatterns.VerifyPayment, verifyData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to verify payment', Services.PAYMENT);
    }
  }

  @Get('my/transactions')
  async getMyTransactions(@GetUser() user: User) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const data = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.GetUserTransactions, { userId: user.id }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get transactions', Services.PAYMENT);
    }
  }

  @Get('transactions')
  @Roles(Role.SUPER_ADMIN)
  async getTransactions() {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const data = await lastValueFrom(this.paymentServiceClient.send(PaymentPatterns.GetTransactions, {}).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get transactions', Services.PAYMENT);
    }
  }

  @Get('transaction/:id')
  @Roles(Role.SUPER_ADMIN)
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
