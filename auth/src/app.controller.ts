import { Controller } from '@nestjs/common';
import { AppService } from './app.service';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @MessagePattern('get_hello')
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern("check_connection")
  checkConnection() {
    return true
  }
}
