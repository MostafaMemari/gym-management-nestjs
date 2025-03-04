import { Global, Module } from '@nestjs/common';
import { ZarinpalService } from './zarinpal.service';
import { HttpModule } from '@nestjs/axios';

@Global()
@Module({
  imports: [
    HttpModule.register({
      maxRedirects: 5,
      timeout: 5000,
    }),
  ],
  providers: [ZarinpalService],
  exports: [ZarinpalService],
})
export class HttpApiModule {}
