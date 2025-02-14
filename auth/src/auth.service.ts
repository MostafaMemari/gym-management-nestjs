import { BadRequestException, forwardRef, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { GenerateTokens, ISignin, ISignup } from './common/interfaces/auth.interface';
import { Services } from './common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UserPatterns } from './common/enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from './common/interfaces/serviceResponse.interface';
import { AuthMessages } from './common/enums/auth.messages';
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt';
import * as dateFns from 'date-fns'
import { RedisPatterns } from './common/enums/redis.events';

@Injectable()
export class AuthService {

  private readonly timeout: number = 4500

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @Inject(Services.REDIS) private readonly redisServiceClientProxy: ClientProxy
  ) { }

  async checkUserServiceConnection(): Promise<never | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      throw new RpcException({ message: "User service is not connected", status: error.status })
    }
  }

  async checkRedisServiceConnection(): Promise<never | void> {
    try {
      await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      throw new RpcException({ message: "Redis service is not connected", status: error.status })
    }
  }

  async checkConnections(): Promise<void | never> {
    const isRedisServiceConnected = this.checkRedisServiceConnection()
    const isUserServiceConnected = this.checkUserServiceConnection()

    await Promise.all([isRedisServiceConnected, isUserServiceConnected])
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

  async verifyAccessToken(verifyTokenDto: { accessToken: string }): Promise<ServiceResponse> {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env

      await this.checkUserServiceConnection()

      const verifiedToken = this.jwtService.verify<{ id: number }>(verifyTokenDto.accessToken, { secret: ACCESS_TOKEN_SECRET })

      if (!verifiedToken.id) {
        throw new BadRequestException(AuthMessages.InvalidTokenPayload)
      }

      return {
        data: { userId: verifiedToken.id },
        error: false,
        message: AuthMessages.VerifiedTokenSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async generateTokens(user: { id: number }): Promise<GenerateTokens> {
    const payload = { id: user.id };

    const parseDays: number = Number.parseInt(process.env.REFRESH_TOKEN_EXPIRE_TIME)

    const now = new Date()

    const futureDate = dateFns.addDays(now, parseDays)

    const refreshTokenExpireTime: number = dateFns.differenceInSeconds(futureDate, now)

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
      expireTime: refreshTokenExpireTime
    }

    await lastValueFrom(this.redisServiceClientProxy.send(RedisPatterns.Set, redisData).pipe(timeout(this.timeout)))

    return { accessToken, refreshToken };
  }

  async signup(signupDto: ISignup): Promise<ServiceResponse> {
    try {
      await this.checkConnections()

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
      throw new RpcException(error)
    }
  }

  async signin(signinDto: ISignin): Promise<ServiceResponse> {
    try {

      await this.checkUserServiceConnection()

      const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByIdentifier, signinDto).pipe(timeout(this.timeout)))


      if (result.error) return result

      const isValidPassword = await bcrypt.compare(signinDto.password, result.data?.user?.password || "")

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
      throw new RpcException(error)
    }
  }

  async signout(signoutDto: { refreshToken: string }): Promise<ServiceResponse> {
    try {
      await this.checkRedisServiceConnection()

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
      throw new RpcException(error)
    }
  }

  async refreshToken({ refreshToken }: { refreshToken: string }): Promise<ServiceResponse> {
    try {
      await this.checkRedisServiceConnection()

      await this.validateRefreshToken(refreshToken)

      const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRE_TIME } = process.env

      const { id } = this.jwtService.verify<{ id: number }>(refreshToken, { secret: REFRESH_TOKEN_SECRET })

      const newAccessToken = this.jwtService.sign({ id }, { secret: ACCESS_TOKEN_SECRET, expiresIn: ACCESS_TOKEN_EXPIRE_TIME })

      return {
        data: { accessToken: newAccessToken },
        error: false,
        message: AuthMessages.RefreshedTokenSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error)
    }
  }

}
