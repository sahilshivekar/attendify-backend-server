import Joi from 'joi';
import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});

const envVarsSchema = Joi.object().
keys({
    NODE_ENV: Joi.string().valid('production', 'development', 'test').required(),
    PORT: Joi.number().default(4444),

    MONGODB_URL: Joi.string().allow(''),

    PG_DEV_DB_USER: Joi.string().required(),
    PG_DEV_DB_HOST: Joi.string().required(),
    PG_DEV_DB_NAME: Joi.string().required(),
    PG_DEV_DB_PASSWORD: Joi.string().required(),
    PG_DEV_DB_PORT: Joi.number().required(),

    PG_TEST_DB_USER: Joi.string().required(),
    PG_TEST_DB_HOST: Joi.string().required(),
    PG_TEST_DB_NAME: Joi.string().required(),
    PG_TEST_DB_PASSWORD: Joi.string().required(),
    PG_TEST_DB_PORT: Joi.number().required(),

    PG_PROD_DB_USER: Joi.string().required(),
    PG_PROD_DB_HOST: Joi.string().required(),
    PG_PROD_DB_NAME: Joi.string().required(),
    PG_PROD_DB_PASSWORD: Joi.string().required(),
    PG_PROD_DB_PORT: Joi.number().required(),

    JWT_ACCESS_TOKEN_SECRET: Joi.string().required(),
    JWT_ACCESS_TOKEN_EXPIRY: Joi.string().required(),
    JWT_REFRESH_TOKEN_SECRET: Joi.string().required(),
    JWT_REFRESH_TOKEN_EXPIRY: Joi.string().required(),

    BCRYPT_SALT: Joi.number().default(10),

    NODEMAILER_USER: Joi.string().email().required(),
    NODEMAILER_PASS: Joi.string().required(),

    ADMIN_USERNAME: Joi.string().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    ADMIN_PASSWORD: Joi.string().required(),

    CLOUDINARY_CLOUD_NAME: Joi.string().required(),
    CLOUDINARY_API_KEY: Joi.string().required(),
    CLOUDINARY_API_SECRET: Joi.string().required(),

    CORS_ORIGIN: Joi.string().default('*')
}).
unknown();

const {
    value: envVars,
    error
} = envVarsSchema.prefs({
    errors: {
        label: 'key'
    }
}).validate(process.env);

if (error) {
    throw new Error(`Config validation error: ${error.message}`);
}

const pgConfig = {
    development: {
        user: envVars.PG_DEV_DB_USER,
        host: envVars.PG_DEV_DB_HOST,
        database: envVars.PG_DEV_DB_NAME,
        password: envVars.PG_DEV_DB_PASSWORD,
        port: envVars.PG_DEV_DB_PORT
    },
    test: {
        user: envVars.PG_TEST_DB_USER,
        host: envVars.PG_TEST_DB_HOST,
        database: envVars.PG_TEST_DB_NAME,
        password: envVars.PG_TEST_DB_PASSWORD,
        port: envVars.PG_TEST_DB_PORT
    },
    production: {
        user: envVars.PG_PROD_DB_USER,
        host: envVars.PG_PROD_DB_HOST,
        database: envVars.PG_PROD_DB_NAME,
        password: envVars.PG_PROD_DB_PASSWORD,
        port: envVars.PG_PROD_DB_PORT
    }
};

const config = {
    env: envVars.NODE_ENV,
    port: envVars.PORT,

    pg: pgConfig[envVars.NODE_ENV],

    jwt: {
        accessTokenSecret: envVars.JWT_ACCESS_TOKEN_SECRET,
        accessTokenExpiry: envVars.JWT_ACCESS_TOKEN_EXPIRY,
        refreshTokenSecret: envVars.JWT_REFRESH_TOKEN_SECRET,
        refreshTokenExpiry: envVars.JWT_REFRESH_TOKEN_EXPIRY
    },

    bcryptSaltRounds: envVars.BCRYPT_SALT,

    email: {
        smtp: {
            host: 'smtp.gmail.com',
            port: 587,
            auth: {
                user: envVars.NODEMAILER_USER,
                pass: envVars.NODEMAILER_PASS
            }
        },
        from: envVars.NODEMAILER_USER
    },

    admin: {
        username: envVars.ADMIN_USERNAME,
        email: envVars.ADMIN_EMAIL,
        password: envVars.ADMIN_PASSWORD
    },

    cloudinary: {
        cloudName: envVars.CLOUDINARY_CLOUD_NAME,
        apiKey: envVars.CLOUDINARY_API_KEY,
        apiSecret: envVars.CLOUDINARY_API_SECRET
    },

    corsOrigin: envVars.CORS_ORIGIN
};

export {
    config
};
