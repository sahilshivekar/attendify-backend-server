import {
    jest
} from '@jest/globals';

jest.unstable_mockModule('../../config/config.js', () => ({
    config: {
        env: 'test'
    }
}));

const {
    errorConverter,
    errorHandler
} = await import('../../middlewares/error.js');
const {
    ApiError
} = await import('../../utils/ApiError.js');
const {
    config
} = await import('../../config/config.js');
const httpStatus = (await import('http-status')).default;
const httpMocks = (await import('node-mocks-http')).default;

describe('Error Middleware', () => {
    let req, res, next;

    beforeEach(() => {
        req = httpMocks.createRequest();
        res = httpMocks.createResponse();
        next = jest.fn();

        jest.clearAllMocks();

        config.env = 'test';

        res.json = jest.fn().mockReturnThis();
        res.status = jest.fn().mockReturnThis();
        res.locals = {};
    });

    describe('errorConverter', () => {
        it('passes through ApiError instances unchanged', async () => {
            const apiError = new ApiError(400, 'Bad Request', ['validation error'], 'stack trace');

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(apiError, req, res, next);

            const result = await nextCalled;
            expect(result).toBe(apiError);
        });

        it('converts regular Error to ApiError with statusCode', async () => {
            const regularError = new Error('Something broke');
            regularError.statusCode = 422;

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(regularError, req, res, next);

            const result = await nextCalled;
            expect(result).toBeInstanceOf(ApiError);
            expect(result.statusCode).toBe(422);
            expect(result.message).toBe('Something broke');
            expect(result.stack).toBe(regularError.stack);
        });

        it('converts regular Error to ApiError with default 500 statusCode', async () => {
            const regularError = new Error('Generic error');

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(regularError, req, res, next);

            const result = await nextCalled;
            expect(result).toBeInstanceOf(ApiError);
            expect(result.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
            expect(result.message).toBe('Generic error');
        });

        it('converts Error without message to default HTTP status message', async () => {
            const regularError = new Error();
            regularError.statusCode = 404;

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(regularError, req, res, next);

            const result = await nextCalled;
            expect(result).toBeInstanceOf(ApiError);
            expect(result.statusCode).toBe(404);
            expect(result.message).toBe(httpStatus[404]);
        });

        it('handles objects without statusCode or message', async () => {
            const errorObject = {
                someProperty: 'value'
            };

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(errorObject, req, res, next);

            const result = await nextCalled;
            expect(result).toBeInstanceOf(ApiError);
            expect(result.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
            expect(result.message).toBe(httpStatus[httpStatus.INTERNAL_SERVER_ERROR]);
        });
    });

    describe('errorHandler', () => {
        describe('in development environment', () => {
            beforeEach(() => {
                config.env = 'development';
            });

            it('responds with full error details including stack trace', () => {
                const apiError = new ApiError(400, 'Validation failed', ['field required'], 'dev stack trace');

                errorHandler(apiError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(400);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(400);
                expect(jsonCall.message).toBe('Validation failed');
                expect(jsonCall.stack).toBe('dev stack trace');
                expect(jsonCall.success).toBe(false);

                expect(res.locals.errorMessage).toBe('Validation failed');
            });

            it('includes stack trace for operational errors in development', () => {
                const operationalError = new ApiError(422, 'Business logic error');
                operationalError.isOperational = true;

                errorHandler(operationalError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(422);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(422);
                expect(jsonCall.message).toBe('Business logic error');
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).toEqual(expect.any(String));
            });

            it('includes stack trace for non-operational errors in development', () => {
                const nonOperationalError = new ApiError(500, 'System error');
                nonOperationalError.isOperational = false;

                errorHandler(nonOperationalError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(500);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(500);
                expect(jsonCall.message).toBe('System error');
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).toEqual(expect.any(String));
            });
        });

        describe('in production environment', () => {
            beforeEach(() => {
                config.env = 'production';
            });

            it('responds with original error for operational errors', () => {
                const operationalError = new ApiError(400, 'Bad request data');
                operationalError.isOperational = true;

                errorHandler(operationalError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(400);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(400);
                expect(jsonCall.message).toBe('Bad request data');
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).not.toBeDefined();
                expect(jsonCall.errors).not.toBeDefined();
                expect(res.locals.errorMessage).toBe('Bad request data');
            });

            it('masks non-operational errors with generic 500 message', () => {
                const nonOperationalError = new ApiError(500, 'Database connection failed');
                nonOperationalError.isOperational = false;

                errorHandler(nonOperationalError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
                expect(jsonCall.message).toBe(httpStatus[httpStatus.INTERNAL_SERVER_ERROR]);
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).not.toBeDefined();
                expect(jsonCall.errors).not.toBeDefined();
                expect(res.locals.errorMessage).toBe('Database connection failed');
            });

            it('masks undefined isOperational as non-operational (defaults to false)', () => {
                const errorWithoutOperational = new ApiError(500, 'Some system error');

                errorWithoutOperational.isOperational = undefined;

                errorHandler(errorWithoutOperational, req, res, next);

                expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
                expect(jsonCall.message).toBe(httpStatus[httpStatus.INTERNAL_SERVER_ERROR]);
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).not.toBeDefined();
                expect(jsonCall.errors).not.toBeDefined();
            });
        });

        describe('in test environment', () => {
            beforeEach(() => {
                config.env = 'test';
            });

            it('responds with full error details like development', () => {
                const testError = new ApiError(404, 'Resource not found');

                errorHandler(testError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(404);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(404);
                expect(jsonCall.message).toBe('Resource not found');
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).toEqual(expect.any(String));
                expect(jsonCall.errors).toBeDefined();
                expect(res.locals.errorMessage).toBe('Resource not found');
            });

            it('does not mask non-operational errors in test environment', () => {
                const nonOperationalError = new ApiError(500, 'Test system error');
                nonOperationalError.isOperational = false;

                errorHandler(nonOperationalError, req, res, next);

                expect(res.status).toHaveBeenCalledWith(500);

                const jsonCall = res.json.mock.calls[0][0];
                expect(jsonCall.statusCode).toBe(500);
                expect(jsonCall.message).toBe('Test system error');
                expect(jsonCall.success).toBe(false);
                expect(jsonCall.stack).toEqual(expect.any(String));
                expect(jsonCall.errors).toBeDefined();
            });
        });
    });

    describe('integration with both middlewares', () => {
        it('errorConverter → errorHandler flow works correctly', async () => {
            const regularError = new Error('Integration test error');
            regularError.statusCode = 409;
            config.env = 'development';

            const nextCalled = new Promise((resolve) => {
                next.mockImplementation((err) => resolve(err));
            });

            errorConverter(regularError, req, res, next);
            const convertedError = await nextCalled;

            errorHandler(convertedError, req, res, next);

            expect(convertedError).toBeInstanceOf(ApiError);
            expect(res.status).toHaveBeenCalledWith(409);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    statusCode: 409,
                    message: 'Integration test error',
                    success: false,
                    stack: expect.any(String)
                })
            );
        });
    });
});
