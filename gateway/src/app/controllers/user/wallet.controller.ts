import { Body, Controller, Get, Inject, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { handleError, handleServiceResponse } from '../../../common/utils/handleError.utils';
import { Services } from '../../../common/enums/services.enum';
import { checkConnection } from '../../../common/utils/checkConnection.utils';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { WalletPatterns } from '../../../common/enums/wallet.events';
import { ApiConsumes, ApiTags } from '@nestjs/swagger';
import { PaymentDto } from '../../../common/dtos/payment.dto';
import { SwaggerConsumes } from '../../../common/enums/swagger-consumes.enum';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { User } from '../../../common/interfaces/user.interface';
import { PaymentPatterns } from '../../../common/enums/payment.events';
import { ServiceResponse } from '../../../common/interfaces/serviceResponse.interface';
import { ManualCreditDto, QueryManualCreditsDto, QueryWalletDeductionsDto, QueryWalletsDto } from '../../../common/dtos/user-service/wallet.dto';

@Controller('wallet')
@ApiTags('wallet')
@AuthDecorator()
export class WalletController {
  private timeout = 5000;

  constructor(
    @Inject(Services.USER) private readonly userServiceClient: ClientProxy,
    @Inject(Services.PAYMENT) private readonly paymentServiceClient: ClientProxy,
  ) {}

  @Post('pay')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async pay(@Body() paymentDto: PaymentDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);
      await checkConnection(Services.USER, this.userServiceClient);

      const wallet: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.GetWalletByUser, { userId: user.id }).pipe(timeout(this.timeout)),
      );

      if (wallet.error) throw wallet;

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
  async verify(@Query('Authority') authority: string, @Query('Status') status: string, @GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);
      await checkConnection(Services.PAYMENT, this.paymentServiceClient);

      const verifyData = {
        authority,
        status,
        frontendUrl: process.env.PAYMENT_FRONTEND_URL,
      };

      const verifiedPayment: ServiceResponse = await lastValueFrom(
        this.paymentServiceClient.send(PaymentPatterns.VerifyPayment, verifyData).pipe(timeout(this.timeout)),
      );

      const { data: paymentData } = handleServiceResponse(verifiedPayment);
      const walletData = { userId: user.id, amount: (paymentData.payment.amount as number) / 10 };

      const { data: chargedWalletData, ...responseMetadata }: ServiceResponse = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.ChargeWallet, walletData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse({ data: Object.assign(chargedWalletData, paymentData), ...responseMetadata });
    } catch (error) {
      handleError(error, 'Failed to verify pay', Services.USER);
    }
  }

  @Post('manual-credit/:walletId')
  @ApiConsumes(SwaggerConsumes.Json, SwaggerConsumes.UrlEncoded)
  async manualCreditWallet(@Param('walletId', ParseIntPipe) walletId: number, @Body() manualCreditDto: ManualCreditDto, @GetUser() user: User) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const manualCreditData = { walletId, creditedBy: user.id, ...manualCreditDto };
      const result = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.ManualCreditWallet, manualCreditData).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(result);
    } catch (error) {
      handleError(error, 'Failed to manual credit wallet', Services.USER);
    }
  }

  @Get()
  async findAll(@Query() walletFilters: QueryWalletsDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data = await lastValueFrom(this.userServiceClient.send(WalletPatterns.GetWallets, walletFilters).pipe(timeout(this.timeout)));

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get wallets', Services.USER);
    }
  }

  @Get('deductions')
  async findAllDeductions(@Query() deductionFilers: QueryWalletDeductionsDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.GetWalletsDeductions, { ...deductionFilers }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get all deductions', Services.USER);
    }
  }

  @Get('manual-credits')
  async findAllManualCredits(@Query() manualCreditFilters: QueryManualCreditsDto) {
    try {
      await checkConnection(Services.USER, this.userServiceClient);

      const data = await lastValueFrom(
        this.userServiceClient.send(WalletPatterns.GetWalletsManualCredits, { ...manualCreditFilters }).pipe(timeout(this.timeout)),
      );

      return handleServiceResponse(data);
    } catch (error) {
      handleError(error, 'Failed to get all manual credits', Services.USER);
    }
  }

  @Get('my-wallet')
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
