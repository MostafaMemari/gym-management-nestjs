export interface ISignup {
    name: string

    email: string

    password: string

    mobile: string
}

export interface GenerateTokens {
    accessToken: string
    refreshToken: string
}