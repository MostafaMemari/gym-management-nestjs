import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { GenerateTokens, IForgetPassword, IResetPassword, ISignin, ISignup, IVerifyOtp } from '../../common/interfaces/auth.interface';
import { Services } from '../../common/enums/services.enum';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { UserPatterns } from '../../common/enums/user.events';
import { lastValueFrom, timeout } from 'rxjs';
import { ServiceResponse } from '../../common/interfaces/serviceResponse.interface';
import { AuthMessages } from '../../common/enums/auth.messages';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import * as dateFns from 'date-fns';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { Redis } from 'ioredis';
import { Smsir } from 'sms-typescript/lib';
import { OtpKeys } from '../../common/enums/redis.keys';
import { ResponseUtil } from '../../common/utils/response.utils';
import { checkConnection } from '../../common/utils/checkConnection.utils';

@Injectable()
export class AuthService {
  private readonly TIMEOUT_MS: number = 4500;
  private readonly OTP_EXPIRATION_SEC = 300; // 5 minutes
  private readonly OTP_REQUEST_LIMIT = 5;
  private readonly OTP_REQUEST_TIMEOUT_SEC = 3600; // 1 hour
  private readonly USER_DATA_EXPIRATION_SEC = 1200; // 20 minutes

  constructor(
    @Inject(forwardRef(() => JwtService)) private readonly jwtService: JwtService,
    @Inject(Services.USER) private readonly userServiceClientProxy: ClientProxy,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  generateOtp() {
    return Math.floor(100_000 + Math.random() * 900_000).toString();
  }

  async validateRefreshToken(refreshToken: string): Promise<never | { refreshTokenKey: string }> {
    const jwtResult = this.jwtService.decode<{ id: number } | undefined>(refreshToken);

    if (!jwtResult?.id) throw new RpcException({ message: AuthMessages.InvalidRefreshToken, status: HttpStatus.BAD_REQUEST });

    const refreshTokenKey = `refreshToken_${jwtResult.id}_${refreshToken}`;

    const storedToken = await this.redis.get(refreshTokenKey);

    if (storedToken !== refreshToken || !storedToken)
      throw new RpcException({ message: AuthMessages.NotFoundRefreshToken, status: HttpStatus.NOT_FOUND });

    return { refreshTokenKey };
  }

  async verifyAccessToken(verifyTokenDto: { accessToken: string }): Promise<ServiceResponse> {
    try {
      const { ACCESS_TOKEN_SECRET } = process.env;

      await checkConnection(Services.USER, this.userServiceClientProxy);

      const verifiedToken = this.jwtService.verify<{ id: number }>(verifyTokenDto.accessToken, { secret: ACCESS_TOKEN_SECRET });

      if (!verifiedToken.id) {
        throw new BadRequestException(AuthMessages.InvalidAccessTokenPayload);
      }

      return ResponseUtil.success({ userId: verifiedToken.id }, AuthMessages.VerifiedTokenSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async generateTokens(user: { id: number }): Promise<GenerateTokens> {
    const payload = { id: user.id };

    const parseDays: number = Number.parseInt(process.env.REFRESH_TOKEN_EXPIRE_TIME);

    const now = new Date();

    const futureDate = dateFns.addDays(now, parseDays);

    const refreshTokenExpireTime: number = dateFns.differenceInSeconds(futureDate, now);

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
      expireTime: refreshTokenExpireTime,
    };

    await this.redis.set(redisData.key, redisData.value, 'EX', redisData.expireTime);

    return { accessToken, refreshToken };
  }

  async signup(signupDto: ISignup): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);
      await this.checkExistingOtp(signupDto.mobile);
      await this.ensureUserDoesNotExist(signupDto.mobile, signupDto.username);

      await this.enforceOtpRequestLimit(`${OtpKeys.RequestsOtp}${signupDto.mobile}`);
      await this.storePendingUser(signupDto);

      const otpCode = this.generateOtp();
      await this.storeOtp(`${OtpKeys.SignupOtp}${signupDto.mobile}`, otpCode);

      await this.sendSms(signupDto.mobile, otpCode);

      return ResponseUtil.success({}, AuthMessages.OtpSentSuccessfully, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async verifyOtp(verifyOtpDto: IVerifyOtp) {
    try {
      const { mobile, otp } = verifyOtpDto;

      await this.enforceOtpRequestLimit(`${OtpKeys.RequestsOtp}${mobile}`);
      await this.validateOtp(`${OtpKeys.SignupOtp}${mobile}`, otp);
      const userData = await this.getPendingUser(mobile);
      const result = await this.createUser(userData);

      const tokens = await this.generateTokens(result.data?.user);
      await this.clearOtpData(mobile);

      return ResponseUtil.success({ ...tokens }, AuthMessages.SignupSuccess, HttpStatus.CREATED);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async signin(signinDto: ISignin): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);

      const result: ServiceResponse = await lastValueFrom(
        this.userServiceClientProxy.send(UserPatterns.GetUserByIdentifier, signinDto).pipe(timeout(this.TIMEOUT_MS)),
      );

      if (result.error) return result;

      const isValidPassword = await bcrypt.compare(signinDto.password, result.data?.user?.password || '');

      if (!isValidPassword) {
        throw new UnauthorizedException(AuthMessages.Unauthorized);
      }

      const tokens = await this.generateTokens(result.data?.user);

      return ResponseUtil.success({ ...tokens }, AuthMessages.SigninSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async signout(signoutDto: { refreshToken: string }): Promise<ServiceResponse> {
    try {
      const { refreshTokenKey } = await this.validateRefreshToken(signoutDto.refreshToken);

      await this.redis.del(refreshTokenKey);

      return ResponseUtil.success({}, AuthMessages.SignoutSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async refreshToken({ refreshToken }: { refreshToken: string }): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);

      await this.validateRefreshToken(refreshToken);

      const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET, ACCESS_TOKEN_EXPIRE_TIME } = process.env;

      const { id } = this.jwtService.verify<{ id: number }>(refreshToken, { secret: REFRESH_TOKEN_SECRET });

      const newAccessToken = this.jwtService.sign({ id }, { secret: ACCESS_TOKEN_SECRET, expiresIn: ACCESS_TOKEN_EXPIRE_TIME });

      return ResponseUtil.success({ accessToken: newAccessToken }, AuthMessages.RefreshedTokenSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async forgetPassword(forgetPasswordDto: IForgetPassword): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);

      const { mobile } = forgetPasswordDto;

      const user = await this.getUserByMobile(forgetPasswordDto.mobile);
      if (user.error) throw user;

      await this.ensurePasswordChangeAllowed(user.data?.user?.lastPasswordChange);

      await this.checkExistingOtp(`${OtpKeys.ResetPasswordOtp}${mobile}`);

      await this.enforceOtpRequestLimit(`${OtpKeys.RequestsOtp}${mobile}`);

      const otpCode = this.generateOtp();
      await this.storeOtp(`${OtpKeys.ResetPasswordOtp}${mobile}`, otpCode);

      await this.sendSms(mobile, otpCode);

      return ResponseUtil.success({}, AuthMessages.OtpSentSuccessfully, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async resetPassword(resetPasswordDto: IResetPassword): Promise<ServiceResponse> {
    try {
      await checkConnection(Services.USER, this.userServiceClientProxy);

      const { mobile, newPassword, otpCode } = resetPasswordDto;

      await this.enforceOtpRequestLimit(`${OtpKeys.RequestsOtp}${mobile}`);

      const otpKey = `${OtpKeys.ResetPasswordOtp}${mobile}`;
      await this.validateOtp(otpKey, otpCode);

      const user = await this.getUserByMobile(mobile);

      if (user.error) return user;

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const updatedUser = await this.updateUser(user.data?.user?.id, { password: hashedPassword, lastPasswordChange: new Date() });

      if (updatedUser.error) throw updatedUser;

      await this.redis.del(otpKey);
      await this.redis.del(`${OtpKeys.RequestsOtp}${mobile}`);

      return ResponseUtil.success({}, AuthMessages.ResetPasswordSuccess, HttpStatus.OK);
    } catch (error) {
      throw new RpcException(error);
    }
  }

  async sendSms(mobile: string, verifyCode: string): Promise<void | never> {
    const { SMS_API_KEY, SMS_LINE_NUMBER, SMS_TEMPLATE_ID, SMS_NAME } = process.env;
    const sms = new Smsir(SMS_API_KEY, Number(SMS_LINE_NUMBER));

    const result = await sms.SendVerifyCode(mobile, Number(SMS_TEMPLATE_ID), [{ name: SMS_NAME, value: verifyCode }]);

    if (result.data?.status !== 1) throw new InternalServerErrorException(AuthMessages.ProblemSendingSms);
  }

  private async clearOtpData(mobile: string): Promise<void | never> {
    await Promise.all([
      this.redis.del(`${OtpKeys.SignupOtp}${mobile}`),
      this.redis.del(`${OtpKeys.PendingUser}${mobile}`),
      this.redis.del(`${OtpKeys.RequestsOtp}${mobile}`),
    ]);
  }

  private async createUser(userData: ISignup): Promise<ServiceResponse> {
    return await lastValueFrom(this.userServiceClientProxy.send(UserPatterns.CreateUser, userData).pipe(timeout(this.TIMEOUT_MS)));
  }

  private async getPendingUser(mobile: string): Promise<ISignup> {
    const userData = await this.redis.get(`${OtpKeys.PendingUser}${mobile}`);
    if (!userData) throw new BadRequestException(AuthMessages.UserDataNotFound);
    return JSON.parse(userData);
  }

  private async validateOtp(otpKey: string, otp: string): Promise<void | never> {
    const storedOtp = await this.redis.get(otpKey);
    const isValidOtp = await bcrypt.compare(otp, storedOtp || '');
    if (!isValidOtp) {
      throw new BadRequestException(AuthMessages.NotFoundOrInvalidOtpCode);
    }
  }

  private async storeOtp(otpKey: string, otp: string): Promise<void | never> {
    const hashedOtp = await bcrypt.hash(otp, 10);
    await this.redis.setex(otpKey, this.OTP_EXPIRATION_SEC, hashedOtp);
  }

  private async storePendingUser(signupDto: ISignup): Promise<void | never> {
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);
    const userData = { ...signupDto, password: hashedPassword };

    await this.redis.setex(`${OtpKeys.PendingUser}${signupDto.mobile}`, this.USER_DATA_EXPIRATION_SEC, JSON.stringify(userData));
  }

  private async enforceOtpRequestLimit(requestKey: string): Promise<void | never> {
    let requestCount = Number(await this.redis.get(requestKey)) || 0;
    const requestCountTtl = await this.redis.ttl(requestKey);
    if (requestCount >= this.OTP_REQUEST_LIMIT) {
      const formattedTime = this.formatSecondsToMinutes(requestCountTtl);
      throw new ForbiddenException(`${AuthMessages.MaxOtpRequests}${formattedTime}.`);
    }

    await this.redis.setex(requestKey, this.OTP_REQUEST_TIMEOUT_SEC, requestCount + 1);
  }

  private async ensureUserDoesNotExist(mobile: string, username: string): Promise<void | never> {
    const userArgs = { mobile, username };
    const userRes: ServiceResponse = await lastValueFrom(
      this.userServiceClientProxy.send(UserPatterns.GetUserByArgs, userArgs).pipe(timeout(this.TIMEOUT_MS)),
    );

    if (userRes.error) throw userRes;
    if (userRes.data?.user) throw new ConflictException(AuthMessages.AlreadySignupUser);
  }

  private async checkExistingOtp(otpKey: string): Promise<void> {
    const existingOtp = await this.redis.get(otpKey);
    const otpTtl = await this.redis.ttl(otpKey);

    if (existingOtp) {
      throw new ConflictException(`${AuthMessages.OtpAlreadySentWithWaitTime}${this.formatSecondsToMinutes(otpTtl)}`);
    }
  }

  private formatSecondsToMinutes(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  private async updateUser(userId: number, data: Record<string, any>): Promise<ServiceResponse> {
    return lastValueFrom(this.userServiceClientProxy.send(UserPatterns.UpdateUser, { userId, ...data }).pipe(timeout(this.TIMEOUT_MS)));
  }

  private async getUserByMobile(mobile: string): Promise<ServiceResponse> {
    return lastValueFrom(this.userServiceClientProxy.send(UserPatterns.GetUserByMobile, { mobile }).pipe(timeout(this.TIMEOUT_MS)));
  }

  private async ensurePasswordChangeAllowed(lastPasswordChange?: string): Promise<void> {
    if (!lastPasswordChange) return;

    const lastChangeDate = new Date(lastPasswordChange);
    const diffDays = Math.floor((Date.now() - lastChangeDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 3) {
      throw new ForbiddenException(AuthMessages.CannotChangePassword);
    }
  }
}
