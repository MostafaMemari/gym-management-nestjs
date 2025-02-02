import { forwardRef, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { GenerateTokens, ISignup } from './interfaces/auth.interface';
import { Services } from './enums/services.enum';
import { ClientProxy } from '@nestjs/microservices';
import { UserPatterns } from './enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from './interfaces/serviceResponse.interface';
import { AuthMessages } from './enums/auth.messages';
import * as bcrypt from 'bcrypt'
import { sendError } from './common/utils/sendError.utils';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisCache } from 'cache-manager-redis-yet';
import { JwtService } from '@nestjs/jwt';
import * as dateFns from 'date-fns'

@Injectable()
export class AuthService {

  private readonly timeout: number = 4500

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @Inject(CACHE_MANAGER) private readonly redisCache: RedisCache
  ) { }

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

    await this.redisCache.set(
      `refreshToken_${user.id}_${refreshToken}`,
      refreshToken,
      refreshTokenMsExpireTime
    );

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

      const tokens = await this.generateTokens(result.data)

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
}
