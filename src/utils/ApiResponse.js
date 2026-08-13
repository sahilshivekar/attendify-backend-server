import httpStatus from 'http-status';

class ApiResponse {
    constructor(statusCode = httpStatus.OK, message = 'Success', data = null) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = statusCode >= httpStatus.OK && statusCode < httpStatus.BAD_REQUEST;
    }
}

export {
    ApiResponse
};
