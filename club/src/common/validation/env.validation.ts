import { ConfigModuleOptions } from '@nestjs/config';
import * as Joi from 'joi';

export default (): ConfigModuleOptions => {
  return {
    isGlobal: true,
    envFilePath: process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env',

    validate: (config: Record<string, any>) => {
      const schema = Joi.object({
        //* Rabbitmq
        RABBITMQ_URL: Joi.string().required(),
        RABBITMQ_QUEUE_NAME: Joi.string().required(),

        //* Database
        DB_TYPE: Joi.string().valid('postgres', 'mysql', 'mariadb', 'mongodb').required(),
        DB_HOST: Joi.string().default('localhost'),
        DB_PORT: Joi.number().default(5432).when('DB_TYPE', { is: 'postgres', then: Joi.required() }),
        DB_USERNAME: Joi.string().default('postgres'),
        DB_PASSWORD: Joi.string().default('').allow(''),
        DB_NAME: Joi.string().default('shop'),
        DB_SYNCHRONIZE: Joi.number().integer().valid(0, 1).default(0),
        DB_SSL: Joi.number().integer().valid(0, 1).default(0),

        //* Redis
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),

        //* S3
        S3_REGION: Joi.string(),
        S3_ACCESS_KEY: Joi.string(),
        S3_SECRET_ACCESS_KEY: Joi.string(),
        S3_BUCKET_NAME: Joi.string(),
        S3_ENDPOINT: Joi.string(),
      }).unknown(true);

      const { error, value } = schema.validate(config);

      if (error) {
        console.error('Env validation error:', error);
        process.exit(1);
      }

      return value;
    },
  };
};
