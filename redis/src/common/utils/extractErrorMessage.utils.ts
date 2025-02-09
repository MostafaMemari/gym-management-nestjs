export const extractErrorMessage = (error: any, defaultMessage: string = '') => {
    let errorMessage = ''

    if (error.message) errorMessage = error.message
    else if (typeof error == 'string')
        errorMessage = error

    return errorMessage || defaultMessage
}