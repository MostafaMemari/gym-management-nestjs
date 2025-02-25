import { Injectable } from '@nestjs/common';

@Injectable()
export class PermissionService {
  getHello(): string {
    return 'Hello World From Permission Service!';
  }
}
