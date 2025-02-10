import { HttpStatus } from '@nestjs/common';

export class ResponseUtil {
  static success<T>(data: T, message = 'Operation successful', status = HttpStatus.OK) {
    return {
      data,
      error: false,
      message,
      status,
    };
  }

  static error(message: string, status = HttpStatus.BAD_REQUEST, data: any = {}) {
    return {
      data,
      error: true,
      message,
      status,
    };
  }
}
