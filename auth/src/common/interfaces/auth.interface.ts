export interface ISignup {
    password: string

    mobile: string

    username: string
}

export interface GenerateTokens {
    accessToken: string
    refreshToken: string
}

export interface ISignin {
    identifier: string
    password: string
}

export interface IForgetPassword {
    mobile: string
}

export interface IResetPassword {
    mobile: string
    otpCode: string
    newPassword: string
}