export enum AuthMessages {
  SignupSuccess = 'User signup success',
  SigninSuccess = 'User signin success',
  Unauthorized = 'Invalid identifier or password',
  SignoutSuccess = 'User signout success',
  InvalidRefreshToken = 'Refresh token is invalid',
  NotFoundRefreshToken = 'Refresh token not found',
  InvalidAccessTokenPayload = 'Access token payload is invalid',
  InvalidRefreshTokenPayload = 'Refresh token payload is invalid',
  VerifiedTokenSuccess = 'Verified token successfully',
  RefreshedTokenSuccess = 'Token refreshed successfully',
  OtpSentSuccessfully = 'Otp sent successfully',
  InvalidOtpCode = 'Otp code is invalid',
  ResetPasswordSuccess = 'Your password has been successfully changed.',
  CannotChangePassword = 'You can only change your password every 3 days.',
  AlreadySentOtpCode = 'Otp code already sent for you.',
  NotFoundOrInvalidOtpCode = 'Otp code is invalid or not found',
  UserDataNotFound = 'User data not found.',
  MaxOtpRequests = 'Max OTP requests reached. Please try again after: ',
  AlreadySignupUser = 'User with this mobile or username already exists.',
  OtpAlreadySentWithWaitTime = 'An OTP has already been sent. Please try again after: ',
  ProblemSendingSms = 'There was a problem sending sms. Please try again later',
  NotFoundStudent = 'Student not found',
  NotFoundCoach = 'Coach not found',
}
