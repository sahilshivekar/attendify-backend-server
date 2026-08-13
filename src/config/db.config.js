import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});

export default {
    development: {
        username: process.env.PG_DEV_DB_USER,
        password: process.env.PG_DEV_DB_PASSWORD,
        database: process.env.PG_DEV_DB_NAME,
        host: process.env.PG_DEV_DB_HOST,
        port: process.env.PG_DEV_DB_PORT,
        dialect: "postgres",
        logging: false

    },
    test: {
        username: process.env.PG_TEST_DB_USER,
        password: process.env.PG_TEST_DB_PASSWORD,
        database: process.env.PG_TEST_DB_NAME,
        host: process.env.PG_TEST_DB_HOST,
        port: process.env.PG_TEST_DB_PORT,
        dialect: "postgres",
        logging: false
    },
    production: {
        username: process.env.PG_PROD_DB_USER,
        password: process.env.PG_PROD_DB_PASSWORD,
        database: process.env.PG_PROD_DB_NAME,
        host: process.env.PG_PROD_DB_HOST,
        port: process.env.PG_PROD_DB_PORT,
        dialect: "postgres",
        logging: false

    }
};
