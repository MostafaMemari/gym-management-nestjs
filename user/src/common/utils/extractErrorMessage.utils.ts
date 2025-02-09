export const extractErrorMessage = (error: any, defaultMessage?: string) => {
    if (typeof error == 'string')
        return error
    else if (typeof error == 'object' && error?.message)
        return error.message

    return defaultMessage || ""
}
