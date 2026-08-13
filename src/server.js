import dotenv from "dotenv";
dotenv.config({
    path: './.env'
});
import app from "./app.js";
import {
    config
} from './config/config.js';
import {
    logger
} from './config/logger.js';

const port = config.port || 4000;

app.listen(port, '0.0.0.0', () => {
    logger.info(`Server started on port ${port} [env: ${config.env}]`);
});
