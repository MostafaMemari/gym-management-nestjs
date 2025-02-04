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
import { RedisPatterns } from './enums/redis.events';

@Injectable()
export class AuthService {

  private readonly timeout: number = 4500

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @Inject(Services.REDIS) private readonly redisServiceClientProxy: ClientProxy
  ) { }

  async checkUserServiceConnection(): Promise<ServiceResponse | void> {
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

  async checkRedisServiceConnection(): Promise<ServiceResponse | void> {
    try {
      await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      return {
        message: "Redis service is not connected",
        error: true,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: {}
      }
    }
  }

  async checkConnections(): Promise<void | ServiceResponse> {
    const isRedisServiceConnected = this.checkRedisServiceConnection()
    const isUserServiceConnected = this.checkUserServiceConnection()

    const connections = await Promise.all([isRedisServiceConnected, isUserServiceConnected])

    for (let i = 0; i < connections.length; i++) {
      if (typeof connections[i] == 'object') {
        return connections[i]
      }
    }

  }

  async validateRefreshToken(refreshToken: string): Promise<boolean | { refreshToken: string }> {
    const { id } = this.jwtService.decode<{ id: number }>(refreshToken)

    const redisData = {
      key: `refreshToken_${id}_${refreshToken}`
    }

    const storedToken: ServiceResponse = await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Get, redisData))

    if (storedToken.error) return false

    if (storedToken.data.value !== refreshToken) return false

    return {
      refreshToken: redisData.key
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

    const redisData = {
      value: refreshToken,
      key: `refreshToken_${user.id}_${refreshToken}`,
      expireTime: refreshTokenMsExpireTime
    }

    await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Set, redisData).pipe(timeout(this.timeout)))

    return { accessToken, refreshToken };
  }

  async signup(signupDto: ISignup): Promise<ServiceResponse> {
    try {
      const connectionResult = await this.checkConnections()

      if (typeof connectionResult == "object" && connectionResult?.error) return connectionResult

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

      const isConnected = await this.checkUserServiceConnection()

      if (typeof isConnected == 'object' && isConnected?.error) return isConnected

      const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByIdentifier, signinDto).pipe(timeout(this.timeout)))


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

  async signout(signoutDto: { refreshToken: string }): Promise<ServiceResponse> {
    try {
      const isConnected = await this.checkRedisServiceConnection()

      if (typeof isConnected == "object" && isConnected?.error) return isConnected

      const validateRefreshToken = await this.validateRefreshToken(signoutDto.refreshToken)

      if (!validateRefreshToken) {
        return {
          data: {},
          error: true,
          message: AuthMessages.InvalidRefreshToken,
          status: HttpStatus.BAD_REQUEST
        }
      }

      let refreshTokenKey = ''
      if (typeof validateRefreshToken == 'object') refreshTokenKey = validateRefreshToken.refreshToken

      const result: ServiceResponse = await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Del, { key: refreshTokenKey }))

      if (result.error) return { ...result, message: AuthMessages.NotFoundRefreshToken }

      return {
        data: {},
        error: false,
        message: AuthMessages.SignoutSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      return sendError(error)
    }
  }
}
