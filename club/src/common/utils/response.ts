import { HttpStatus, Logger } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class ResponseUtil {
  private static readonly logger = new Logger(ResponseUtil.name);

  static success<T>(data: T, message = 'Operation completed successfully', status = HttpStatus.OK) {
    return {
      data,
      error: false,
      message,
      status,
    };
  }

  static error(message = 'Internal service error occurred', status = HttpStatus.INTERNAL_SERVER_ERROR, originalError?: any) {
    const errorResponse = {
      message,
      status,
    };

    this.logger.error(`[RPC ERROR] Status: ${status}, Message: ${message}`, originalError?.stack || '');

    throw new RpcException(errorResponse);
  }
}
