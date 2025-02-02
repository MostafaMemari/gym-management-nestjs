import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ISignup } from './interfaces/auth.interface';
import { Services } from './enums/services.enum';
import { ClientGrpcProxy, ClientProxy } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from './interfaces/serviceResponse.interface';
import { AuthMessages } from './enums/auth.messages';
import { AuthPatterns } from './enums/auth.events';
import * as bcrypt from 'bcrypt'
import { sendError } from './common/utils/sendError.utils';

@Injectable()
export class AuthService {

  private readonly timeout: number = 45000

  constructor(@Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy) { }

  async checkConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      return {
        message: UserPatterns.NotConnected,
        error: true,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {}
      }
    }
  }

  async signup(data: ISignup): Promise<ServiceResponse> {
    try {
      const isConnected = await this.checkConnection()

      if (typeof isConnected == "object" && isConnected?.error) return isConnected

      const hashedPassword = await bcrypt.hash(data.password, 10)
      data = {
        ...data,
        password: hashedPassword
      }

      const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CreateUser, data).pipe(timeout(this.timeout)))

      if (result.error) return result

      return {
        message: AuthMessages.SignupSuccess,
        status: HttpStatus.CREATED,
        error: false,
        data: result.data
      }
    } catch (error) {
      return sendError(error)
    }
  }
}
