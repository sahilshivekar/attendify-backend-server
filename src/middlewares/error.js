import httpStatus from 'http-status';
import {
    config
} from '../config/config.js';
import {
    logger
} from '../config/logger.js';
import {
    ApiError
} from '../utils/ApiError.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';

const errorConverter = (err, req, res, next) => {
    let error = err;
    if (error?.name == 'SequelizeUniqueConstraintError') {
        error.statusCode = httpStatus.CONFLICT;
    } else if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || httpStatus.INTERNAL_SERVER_ERROR;
        const message = error.message || httpStatus[statusCode];
        error = new ApiError(statusCode, message, [], err.stack);
    }

    next(error);
};

const errorHandler = (err, req, res, next) => {
    let {
        statusCode,
        message
    } = err;
    if (config.env === 'production' && !err.isOperational) {
        statusCode = httpStatus.INTERNAL_SERVER_ERROR;
        message = httpStatus[httpStatus.INTERNAL_SERVER_ERROR];
    }
    if (err.statusCode === httpStatus.UNAUTHORIZED) {
        res.set('WWW-Authenticate', 'Bearer');
    }

    res.locals.errorMessage = err.message;
    res.locals.stack = err.stack;

    const shouldIncludeDebugInfo = config.env !== 'production';

    const response = {
        statusCode,
        message,
        success: false,
        ...(shouldIncludeDebugInfo && Array.isArray(err.errors) && err.errors.length >= 0 && {
            errors: err.errors
        }),
        ...(shouldIncludeDebugInfo && {
            stack: err.stack
        })
    };

    res.
    status(statusCode).
    json(response);
};

export {
    errorConverter,
    errorHandler
};
