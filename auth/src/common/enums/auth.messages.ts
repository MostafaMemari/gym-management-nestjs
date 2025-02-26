export enum AuthMessages {
    SignupSuccess = "User signup success",
    SigninSuccess = "User signin success",
    Unauthorized = "Invalid identifier or password",
    SignoutSuccess = 'User signout success',
    InvalidRefreshToken = 'Refresh token is invalid',
    NotFoundRefreshToken = "Refresh token not found",
    InvalidAccessTokenPayload = 'Access token payload is invalid',
    InvalidRefreshTokenPayload = "Refresh token payload is invalid",
    VerifiedTokenSuccess = "Verified token successfully",
    RefreshedTokenSuccess = "Token refreshed successfully",
    OtpSentSuccessfully = "Otp sent successfully",
    InvalidOtpCode = "Otp code is invalid",
    ResetPasswordSuccess = "Your password has been successfully changed."
}