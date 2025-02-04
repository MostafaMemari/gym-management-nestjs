import * as Joi from "joi@hapi/";

export const envValidationSchema = Joi.object({
  // Database
  DB_TYPE: Joi.string().valid("postgres", "mysql", "mariadb", "mongodb").required(),
  DB_HOST: Joi.string().default("localhost"),
  DB_PORT: Joi.number().default(5432).when("DB_TYPE", { is: "postgres", then: Joi.required() }),
  DB_USERNAME: Joi.string().default("postgres"),
  DB_PASSWORD: Joi.string().default("").allow(""),
  DB_NAME: Joi.string().default("shop"),
  DB_SYNCHRONIZE: Joi.number().integer().valid(0, 1).default(0),
  DB_SSL: Joi.number().integer().valid(0, 1).default(0),
});
