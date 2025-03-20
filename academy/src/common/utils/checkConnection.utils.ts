import { InternalServerErrorException } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { lastValueFrom, timeout } from 'rxjs';

interface CheckConnectionOptions {
  timeout?: number;
  pattern?: any;
}

export const checkConnection = async (
  serviceName: string,
  clientProxy: ClientProxy,
  options?: CheckConnectionOptions,
): Promise<void | never> => {
  try {
    const pattern = options?.pattern || 'check_connection';
    const timeoutTtl = options?.timeout || 5000;

    await lastValueFrom(clientProxy.send(pattern, {}).pipe(timeout(timeoutTtl)));
  } catch (error) {
    console.log(error);
    throw new InternalServerErrorException(`${serviceName} unavailable`);
  }
};
