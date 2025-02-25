import { Controller } from '@nestjs/common';
import { PermissionService } from './permission.service';
import { MessagePattern } from '@nestjs/microservices';
import { PermissionPatterns } from './enums/permission.events';

@Controller()
export class PermissionController {
  constructor(private readonly permissionService: PermissionService) { }

  @MessagePattern(PermissionPatterns.getHello)
  getHello(): string {
    return this.permissionService.getHello();
  }

  @MessagePattern(PermissionPatterns.checkConnection)
  checkConnection() {
    return true
  }
}
