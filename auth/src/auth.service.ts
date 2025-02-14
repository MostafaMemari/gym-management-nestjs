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
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis'

@Injectable()
export class AuthService {

  private readonly timeout: number = 4500

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRedis() private readonly redis: Redis
  ) { }

  async checkUserServiceConnection(): Promise<never | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.timeout)))
    } catch (error) {
      throw new RpcException({ message: "User service is not connected", status: error.status })
    }
  }

  async validateRefreshToken(refreshToken: string): Promise<never | { refreshTokenKey: string }> {
    const jwtResult = this.jwtService.decode<{ id: number } | undefined>(refreshToken)

    if (!jwtResult?.id)
      throw new RpcException({ message: AuthMessages.InvalidRefreshToken, status: HttpStatus.BAD_REQUEST })

    const refreshTokenKey = `refreshToken_${jwtResult.id}_${refreshToken}`

    const storedToken = await this.redis.get(refreshTokenKey)

    if (storedToken !== refreshToken || !storedToken)
      throw new RpcException({ message: AuthMessages.NotFoundRefreshToken, status: HttpStatus.NOT_FOUND })

    return { refreshTokenKey }
  }

  async verifyAccessToken(verifyTokenDto: { accessToken: string }): Promise<ServiceResponse> {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env

      await this.checkUserServiceConnection()

      const verifiedToken = this.jwtService.verify<{ id: number }>(verifyTokenDto.accessToken, { secret: ACCESS_TOKEN_SECRET })

      if (!verifiedToken.id) {
        throw new BadRequestException(AuthMessages.InvalidAccessTokenPayload)
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

    await this.redis.set(redisData.key, redisData.value, "EX", redisData.expireTime)

    return { accessToken, refreshToken };
  }

  async signup(signupDto: ISignup): Promise<ServiceResponse> {
    try {
      await this.checkUserServiceConnection()

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
      const { refreshTokenKey } = await this.validateRefreshToken(signoutDto.refreshToken)

      await this.redis.del(refreshTokenKey)

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
      await this.checkUserServiceConnection()

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
