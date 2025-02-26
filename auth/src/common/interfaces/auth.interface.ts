export interface ISignup {
    name: string

    password: string

    mobile: string
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