import { ConfigModuleOptions } from "@nestjs/config";
import * as Joi from "joi";

export default (): ConfigModuleOptions => {
    return {
        isGlobal: true,
        envFilePath: process.cwd() + "/.env",
        validate: (config: Record<string, any>) => {
            const schema = Joi.object({
                PORT: Joi.string().required(),
                RABBITMQ_URL: Joi.string().required(),
                RABBITMQ_AUTH_SERVICE_QUEUE: Joi.string().required()
            }).unknown(true)

            const { error, value } = schema.validate(config)

            if (error) {
                console.error('Env validation error:', error)
                process.exit(1)
            }

            return value
        }
    }
}