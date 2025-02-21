import { ConfigModuleOptions } from "@nestjs/config";
import * as Joi from "joi";

export default (): ConfigModuleOptions => {
  return {
    isGlobal: true,
    envFilePath: process.cwd() + "/.env",
    validate: (config: Record<string, any>) => {
      const schema = Joi.object({
        RABBITMQ_URL: Joi.string().required(),
        RABBITMQ_QUEUE_NAME: Joi.string().required(),
      }).unknown(true);

      const { error, value } = schema.validate(config);

      if (error) {
        console.error("Env validation error:", error);
        process.exit(1);
      }

      return value;
    },
  };
};
