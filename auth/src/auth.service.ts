import { forwardRef, HttpStatus, Inject, Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { GenerateTokens, ISignin, ISignup } from './interfaces/auth.interface';
import { Services } from './enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from './interfaces/serviceResponse.interface';
import { AuthMessages } from './enums/auth.messages';
import * as bcrypt from 'bcrypt'
import { sendError } from './common/utils/sendError.utils';
import { JwtService } from '@nestjs/jwt';
import * as dateFns from 'date-fns'

@Injectable()
export class AuthService {

  private readonly timeout: number = 4500

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
  ) { }

  async checkConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      return {
        message: "User service is not connected",
        error: true,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {}
      }
    }
  }

  async generateTokens(user: { id: number }): Promise<GenerateTokens> {
    const payload = { id: user.id };

    const parseDays: number = Number.parseInt(process.env.REFRESH_TOKEN_EXPIRE_TIME)
    const refreshTokenMsExpireTime: number = dateFns.milliseconds({ days: parseDays })

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.ACCESS_TOKEN_SECRET,
      expiresIn: process.env.ACCESS_TOKEN_EXPIRE_TIME,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRE_TIME,
      secret: process.env.REFRESH_TOKEN_SECRET,
    });

    //TODO: Set refresh token in redis

    return { accessToken, refreshToken };
  }

  async signup(signupDto: ISignup): Promise<ServiceResponse> {
    try {
      const isConnected = await this.checkConnection()

      if (typeof isConnected == "object" && isConnected?.error) return isConnected

      const hashedPassword = await bcrypt.hash(signupDto.password, 10)

      const data = {
        ...signupDto,
        password: hashedPassword
      }

      const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CreateUser, data).pipe(timeout(this.timeout)))

      if (result.error) return result

      const tokens = await this.generateTokens(result.data?.user)

      return {
        message: AuthMessages.SignupSuccess,
        status: HttpStatus.CREATED,
        error: false,
        data: { ...tokens }
      }
    } catch (error) {
      return sendError(error)
    }
  }

  async signin(signinDto: ISignin): Promise<ServiceResponse> {
    try {

      const isConnected = await this.checkConnection()

      if (typeof isConnected == 'object' && isConnected?.error) return isConnected

      const result = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByIdentifier, signinDto).pipe(timeout(this.timeout)))


      if (result.error) return result

      const isValidPassword = await bcrypt.compare(signinDto.password, result.data?.user?.password)

      if (!isValidPassword) {
        throw new UnauthorizedException(AuthMessages.Unauthorized)
      }

      const tokens = await this.generateTokens(result.data?.user)

      return {
        data: { ...tokens },
        error: false,
        message: AuthMessages.SigninSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      return sendError(error)
    }
  }
}
