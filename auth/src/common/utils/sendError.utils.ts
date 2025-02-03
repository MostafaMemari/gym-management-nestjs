import { HttpStatus } from "@nestjs/common";
import { ServiceResponse } from "../../interfaces/serviceResponse.interface";

const extractErrorMessage = (error: any, defaultMessage?: string) => {
    if (typeof error == 'string')
        return error
    else if (typeof error == 'object' && error?.message)
        return error.message

    return defaultMessage || ""
}

export const sendError = (error: any): ServiceResponse => {
    const authServiceMessage = "Auth Service Internal Server Error !!"
    const errorMessage = extractErrorMessage(error, authServiceMessage)
    const status = error.status || error.statusCode || HttpStatus.INTERNAL_SERVER_ERROR

    return {
        error: true,
        data: {},
        message: errorMessage,
        status
    }
}
