import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '../../../common/enums/role.enum';
import { handleError, handleServiceResponse } from 'src/common/utils/handleError.utils';
import { Services } from 'src/common/enums/services.enum';
import { checkConnection } from 'src/common/utils/checkConnection.utils';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { WalletPatterns } from 'src/common/enums/wallet.events';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from 'src/common/dtos/payment.dto';
import { SwaggerConsumes } from 'src/common/enums/swagger-consumes.enum';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/common/interfaces/user.interface';
import { PaymentPatterns } from 'src/common/enums/payment.events';
import { ServiceResponse } from 'src/common/interfaces/serviceResponse.interface';

@Controller('wallet')
@ApiTags('wallet')
@AuthDecorator()
export class WalletController {
  private timeout = 5000;

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    @Inject(Services.PAYMENT) private readonly paymentServiceClient: ClientProxy,
  ) { }

  @Post('pay')
  @Roles(Role.ADMIN_CLUB)
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async pay(@Body() paymentDto: PaymentDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const paymentData = {
        ...paymentDto,
        user,
        callbackUrl: `${process.env.BASE_URL}/wallet/verify`,
        userId: user.id,
      };

      const data = await lastValueFrom(this.paymentServiceClient.send(PaymentPatterns.CreateGatewayUrl, paymentData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to pay', Services.USER);
    }
  }

  @Get('verify')
  @Roles(Role.ADMIN_CLUB)
  async verify(@Query('Authority') authority: string, @Query('Status') status: string, @GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const verifyData = {
        authority,
        status,
        frontendUrl: process.env.PAYMENT_FRONTEND_URL,
      };

      const data: ServiceResponse = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.VerifyPayment, verifyData).pipe(timeout(this.timeout)),
      );

      const { data: paymentData } = handleServiceResponse(data);
      const walletData = { userId: user.id, amount: paymentData.payment.amount / 10 };

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.ChargeWallet, walletData).pipe(timeout(this.timeout)),
      );

      result.data.payment = paymentData.payment;

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to verify pay', Services.USER);
    }
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  async findAll() {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.GetWallets, {}).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get wallets', Services.USER);
    }
  }

  @Get("my-wallet")
  @Roles(Role.ADMIN_CLUB)
  async getMyWallet(@GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.GetWalletByUser, { userId: user.id }).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get my wallet', Services.USER);
    }
  }


  @Get(':id')
  @Roles(Role.SUPER_ADMIN)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const walletData = { walletId: id };

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.GetOneWallet, walletData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get wallet', Services.USER);
    }
  }

  @Put('block/:id')
  @Roles(Role.SUPER_ADMIN)
  async block(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const walletData = { walletId: id };

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.BlockWallet, walletData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to block wallet', Services.USER);
    }
  }

  @Put('unblock/:id')
  @Roles(Role.SUPER_ADMIN)
  async unblock(@Param('id', ParseIntPipe) id: number) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const walletData = { walletId: id };

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.UnblockWallet, walletData).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to unblock wallet', Services.USER);
    }
  }
}
