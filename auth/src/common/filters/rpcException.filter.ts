import { ArgumentsHost, Catch, HttpStatus, RpcExceptionFilter } from "@nestjs/common";
import { RpcException } from "@nestjs/microservices";
import { extractErrorMessage } from "../utils/extractErrorMessage.utils";

@Catch(RpcException)
export class CustomRpcException implements RpcExceptionFilter<RpcException> {
    catch(exception: RpcException, host: ArgumentsHost): any {
        const errorResponse: any = exception.getError()
        const errorMessage = extractErrorMessage(errorResponse, "Internal auth service error")
        const errorStatus = errorResponse?.status || HttpStatus.INTERNAL_SERVER_ERROR

        return {
            data: {},
            error: true,
            message: errorMessage,
            status: errorStatus
        }
    }
}