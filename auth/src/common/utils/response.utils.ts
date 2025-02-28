import { HttpStatus } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ServiceResponse } from '../interfaces/serviceResponse.interface';

export class ResponseUtil {
    static success<T>(data: T, message = 'Operation completed successfully', status = HttpStatus.OK): ServiceResponse {
        return {
            data,
            error: false,
            message,
            status,
        };
    }

    static error(originalError?: any, message = 'Internal auth service error', status = HttpStatus.INTERNAL_SERVER_ERROR): never {
        if (originalError) throw new RpcException(originalError)

        const errorResponse = {
            message,
            status,
        };

        throw new RpcException(errorResponse);
    }
}
