import { HttpException, HttpStatus } from '@nestjs/common';
import { ServiceResponse } from '../interfaces/serviceResponse.interface';
import { Logger } from '@nestjs/common';

export function handleServiceResponse(data: ServiceResponse) {
  if (data.error) throw new HttpException(data.message, data.status);
  return data;
}

export function handleError(error: any, defaultMessage: string = '', service: string) {
  const logger = new Logger('ErrorHandler');

  const timestamp = new Date().toISOString();

  logger.error(`[${timestamp}] [${service}] ${error?.message || defaultMessage}`);

  throw new HttpException(
    {
      message: error.message || defaultMessage,
      status: HttpStatus.INTERNAL_SERVER_ERROR,
    },
    HttpStatus.INTERNAL_SERVER_ERROR,
  );
}
