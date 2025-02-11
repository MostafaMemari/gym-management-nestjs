import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';

export class ResponseUtil {
  static success<T>(data: T, message = 'Operation completed successfully', status = HttpStatus.OK) {
    return {
      data,
      error: false,
      message,
      status,
    };
  }

  static error(message = 'Internal service error occurred', status = HttpStatus.INTERNAL_SERVER_ERROR) {
    // console.log(message);
    // try {
    throw new RpcException({
      message,
      status,
    });
    // } catch (error) {
    //   throw new RpcException({
    //     message: error.message || 'Unknown error occurred',
    //     status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    //     errorDetails: {
    //       message: error.message || 'Unknown error occurred',
    //       status: error.status || HttpStatus.INTERNAL_SERVER_ERROR,
    //     },
    //   });
    // }
  }
}
