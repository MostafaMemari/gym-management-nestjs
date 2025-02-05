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

export interface ISignin {
    identifier: string
    password: string
}

export interface IGoogleOauth {
    username: string
    email: string
}