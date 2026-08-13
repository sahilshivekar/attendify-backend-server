import winston from 'winston';
import {
    config
} from './config.js';

const enumerateErrorFormat = winston.format((info) => {
    if (info instanceof Error) {
        Object.assign(info, {
            message: info.stack
        });
    }
    return info;
});

const logFormat = winston.format.printf(({
    timestamp,
    level,
    message,
    ...meta
}) => {
    let metaString = Object.keys(meta).length ? ` | ${JSON.stringify(meta)}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}`;
});

const logger = winston.createLogger({
    level: config.env === 'development' ? 'debug' : 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        enumerateErrorFormat(),
        winston.format.splat(),
        winston.format.errors({
            stack: true
        }),
        logFormat
    ),
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                config.env === 'development' ? winston.format.colorize({
                    all: true
                }) : winston.format.uncolorize(),
                winston.format.timestamp({
                    format: 'YYYY-MM-DD HH:mm:ss'
                }),
                enumerateErrorFormat(),
                winston.format.splat(),
                winston.format.errors({
                    stack: true
                }),
                logFormat
            ),
            stderrLevels: ['error']
        })
    ]

});

export {
    logger
};
