import { BadRequestException, ConflictException, ForbiddenException, forwardRef, HttpStatus, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { GenerateTokens, IForgetPassword, IResetPassword, ISignin, ISignup } from '../../common/interfaces/auth.interface';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UserPatterns } from '../../common/enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { AuthMessages } from '../../common/enums/auth.messages';
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt';
import * as dateFns from 'date-fns'
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis'
import { Smsir } from 'sms-typescript/lib'
import { OtpKeys } from 'src/common/enums/redis.keys';

@Injectable()
export class AuthService {

  private readonly TIMEOUT_MS: number = 4500
  private readonly OTP_EXPIRATION_SEC = 300; // 5 minutes
  private readonly OTP_REQUEST_LIMIT = 5;
  private readonly OTP_REQUEST_TIMEOUT_SEC = 3600; // 1 hour
  private readonly USER_DATA_EXPIRATION_SEC = 1200; // 20 minutes

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRedis() private readonly redis: Redis
  ) { }

  async checkUserServiceConnection(): Promise<never | void> {
    try {
      await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CheckConnection, {}).pipe(timeout(this.TIMEOUT_MS)))
    } catch (error) {
      throw new RpcException({ message: "User service is not connected", status: error.status })
    }
  }

  generateOtp() {
    return Math.floor(100_000 + Math.random() * 900_000).toString()
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
      await this.checkUserServiceConnection();
      await this.checkExistingOtp(signupDto.mobile)
      await this.ensureUserDoesNotExist(signupDto.mobile, signupDto.username);

      await this.enforceOtpRequestLimit(signupDto.mobile);
      await this.storePendingUser(signupDto);

      const otpCode = this.generateOtp();
      await this.storeOtp(signupDto.mobile, otpCode);
      await this.sendSms(signupDto.mobile, otpCode);

      return this.createResponse(AuthMessages.OtpSentSuccessfully, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verifyOtp(verifyOtpDto: any) {
    try {
      const { mobile, otp } = verifyOtpDto;

      await this.enforceOtpRequestLimit(mobile);
      await this.validateOtp(mobile, otp);

      const userData = await this.getPendingUser(mobile);
      const result = await this.createUser(userData);

      const tokens = await this.generateTokens(result.data?.user);
      await this.clearOtpData(mobile);

      return this.createResponse(AuthMessages.SignupSuccess, HttpStatus.CREATED, tokens);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async signin(signinDto: ISignin): Promise<ServiceResponse> {
    try {
      await this.checkUserServiceConnection()

      const result: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByIdentifier, signinDto).pipe(timeout(this.TIMEOUT_MS)))


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

  async forgetPassword(forgetPasswordDto: IForgetPassword): Promise<ServiceResponse> {
    try {
      await this.checkUserServiceConnection()

      const { mobile } = forgetPasswordDto
      const user: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByMobile, { mobile }).pipe(timeout(this.TIMEOUT_MS)))

      if (user.error) return user

      const resetPasswordKey = `${OtpKeys.ResetPasswordOtp}${mobile}`

      const existingOtp = await this.redis.get(resetPasswordKey)

      if (existingOtp)
        throw new BadRequestException(AuthMessages.AlreadySentOtpCode)

      const currentDate = new Date()

      let { user: { lastPasswordChange } = {} } = user.data

      if (lastPasswordChange) {
        lastPasswordChange = new Date(lastPasswordChange)
        const diffDays = Math.floor((currentDate.getTime() - lastPasswordChange.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 3)
          throw new ForbiddenException(AuthMessages.CannotChangePassword)
      }

      const otpCode = this.generateOtp()

      await this.redis.set(resetPasswordKey, otpCode, 'EX', this.OTP_EXPIRATION_SEC)

      await this.sendSms(mobile, otpCode)

      const updateUserData = {
        lastPasswordChange: currentDate,
        userId: user.data.user.id
      }

      const updatedUser = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.UpdateUser, updateUserData).pipe(timeout(this.TIMEOUT_MS)))
      if (updatedUser.error) return updatedUser

      return {
        data: {},
        error: false,
        message: AuthMessages.OtpSentSuccessfully,
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async resetPassword(resetPasswordDto: IResetPassword): Promise<ServiceResponse> {
    try {
      await this.checkUserServiceConnection()

      const { mobile, newPassword, otpCode } = resetPasswordDto

      const otpKey = `${OtpKeys.ResetPasswordOtp}${mobile}`

      const storedOtp = await this.redis.get(otpKey)

      if (!storedOtp || otpCode !== storedOtp)
        throw new BadRequestException(AuthMessages.InvalidOtpCode)


      const user: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByMobile, { mobile }).pipe(timeout(this.TIMEOUT_MS)))

      if (user.error) return user

      const hashedPassword = await bcrypt.hash(newPassword, 10)

      const updateUserData = {
        password: hashedPassword,
        userId: user.data?.user?.id
      }

      const updatedUser: ServiceResponse = await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.UpdateUser, updateUserData).pipe(timeout(this.TIMEOUT_MS)))

      if (updatedUser.error) throw updatedUser

      await this.redis.del(otpKey)

      return {
        data: {},
        error: false,
        message: AuthMessages.ResetPasswordSuccess,
        status: HttpStatus.OK
      }
    } catch (error) {
      throw new RpcException(error)
    }
  }

  async sendSms(mobile: string, verifyCode: string): Promise<{ message: string, status: number }> {
    const { SMS_API_KEY, SMS_LINE_NUMBER, SMS_TEMPLATE_ID, SMS_NAME } = process.env
    const sms = new Smsir(SMS_API_KEY, Number(SMS_LINE_NUMBER))

    const result = await sms.SendVerifyCode(mobile, Number(SMS_TEMPLATE_ID), [{ name: SMS_NAME, value: verifyCode }])

    if (result.data?.status == 1) return { message: "success", status: 200 }
    else return { message: "failed", status: 500 }
  }

  private async clearOtpData(mobile: string): Promise<void | never> {
    await Promise.all([
      this.redis.del(`${OtpKeys.SignupOtp}${mobile}`),
      this.redis.del(`${OtpKeys.PendingUser}${mobile}`),
      this.redis.del(`${OtpKeys.RequestsOtp}${mobile}`)
    ]);
  }

  private async createUser(userData: ISignup): Promise<ServiceResponse> {
    return await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.CreateUser, userData).pipe(timeout(this.TIMEOUT_MS))
    );
  }

  private async getPendingUser(mobile: string): Promise<ISignup> {
    const userData = await this.redis.get(`${OtpKeys.PendingUser}${mobile}`);
    if (!userData) throw new BadRequestException(AuthMessages.UserDataNotFound);
    return JSON.parse(userData);
  }

  private async validateOtp(mobile: string, otp: string): Promise<void | never> {
    const storedOtp = await this.redis.get(`${OtpKeys.SignupOtp}${mobile}`);
    if (!storedOtp || storedOtp !== otp) {
      throw new BadRequestException(AuthMessages.NotFoundOrInvalidOtpCode);
    }
  }

  private async storeOtp(mobile: string, otp: string): Promise<void | never> {
    const otpKey = `${OtpKeys.SignupOtp}${mobile}`;
    await this.redis.setex(otpKey, this.OTP_EXPIRATION_SEC, otp);
  }

  private async storePendingUser(signupDto: ISignup): Promise<void | never> {
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const userData = { ...signupDto, password: hashedPassword };

    await this.redis.setex(
      `${OtpKeys.PendingUser}${signupDto.mobile}`,
      this.USER_DATA_EXPIRATION_SEC,
      JSON.stringify(userData)
    );
  }

  private async enforceOtpRequestLimit(mobile: string) {
    const requestKey = `${OtpKeys.RequestsOtp}${mobile}`;
    let requestCount = Number(await this.redis.get(requestKey)) || 0;

    if (requestCount >= this.OTP_REQUEST_LIMIT) {
      const formattedTime = this.formatSecondsToMinutes(this.OTP_REQUEST_TIMEOUT_SEC)
      throw new ForbiddenException(`${AuthMessages.MaxOtpRequests}${formattedTime}.`);
    }

    await this.redis.setex(requestKey, this.OTP_REQUEST_TIMEOUT_SEC, requestCount + 1);
  }

  private async ensureUserDoesNotExist(mobile: string, username: string) {
    const userArgs = { mobile, username };
    const userRes: ServiceResponse = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.GetUserByArgs, userArgs).pipe(timeout(this.TIMEOUT_MS))
    );

    if (userRes.error) throw userRes;
    if (userRes.data?.user) throw new ConflictException(AuthMessages.AlreadySignupUser);
  }

  private async checkExistingOtp(mobile: string): Promise<void> {
    const otpKey = `${OtpKeys.SignupOtp}${mobile}`;
    const existingOtp = await this.redis.get(otpKey);
    const otpTtl = await this.redis.ttl(otpKey);

    if (existingOtp) {
      throw new ConflictException(`${AuthMessages.OtpAlreadySentWithWaitTime}${this.formatSecondsToMinutes(otpTtl)}`);
    }
  }

  private createResponse(message: string, status: HttpStatus, data: any = {}): ServiceResponse {
    return { message, status, error: false, data };
  }

  formatSecondsToMinutes(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }
}
