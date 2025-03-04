import { Controller, Get, Inject, Param, ParseIntPipe, Post, Put } from '@nestjs/common';
import { AuthDecorator } from '../../../common/decorators/auth.decorator';
import { Roles } from '../../../common/decorators/role.decorator';
import { Role } from '../../../common/enums/role.enum';
import { handleError, handleServiceResponse } from 'src/common/utils/handleError.utils';
import { Services } from 'src/common/enums/services.enum';
import { checkConnection } from 'src/common/utils/checkConnection.utils';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';
import { WalletPatterns } from 'src/common/enums/wallet.events';
import { ApiTags } from '@nestjs/swagger';

@Controller('wallet')
@ApiTags('wallet')
@AuthDecorator()
export class WalletController {
  private timeout = 5000;

  constructor(@Inject(Services.USER) private readonly userServiceClient: ClientProxy) {}

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

  @Get(':id')
  @Roles(Role.ADMIN_CLUB)
  async findOne(@Param('id') id: number) {
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
