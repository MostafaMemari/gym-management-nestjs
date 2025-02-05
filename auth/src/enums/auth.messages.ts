export enum AuthMessages {
    SignupSuccess = "User signup success",
    SigninSuccess = "User signin success",
    Unauthorized = "Invalid identifier or password",
    SignoutSuccess = 'User signout success',
    InvalidRefreshToken = 'Refresh token is invalid',
    NotFoundRefreshToken = "Refresh token not found",
    InvalidTokenPayload = 'Access token payload is invalid',
    VerifiedTokenSuccess = "Verified token successfully",
    RefreshedTokenSuccess = "Token refreshed successfully",
    AuthorizedSuccess = "Authorized success"
}