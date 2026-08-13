import {
    jest
} from '@jest/globals';

const validate = (await import('../../middlewares/validate.js')).default;
const {
    ApiError
} = await import('../../utils/ApiError.js');
const httpStatus = (await import('http-status')).default;
const Joi = (await import('joi')).default;

describe('validate middleware', () => {
    let req, next;

    beforeEach(() => {
        req = {
            params: {},
            query: {},
            body: {}
        };
        next = jest.fn();
    });

    it('calls next with no error when validation passes', () => {
        const schema = {
            body: Joi.object({
                name: Joi.string().required()
            })
        };
        req.body = {
            name: 'John'
        };
        validate(schema)(req, {}, next);
        expect(next).toHaveBeenCalledWith();
        expect(req.body.name).toBe('John');
    });

    it('calls next with ApiError when validation fails', () => {
        const schema = {
            body: Joi.object({
                name: Joi.string().required()
            })
        };
        req.body = {};
        validate(schema)(req, {}, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: httpStatus.BAD_REQUEST,
                message: expect.stringContaining('name')
            })
        );
    });

    it('validates params and query as well', () => {
        const schema = {
            params: Joi.object({
                id: Joi.number().required()
            }),
            query: Joi.object({
                q: Joi.string().required()
            })
        };
        req.params = {
            id: 123
        };
        req.query = {
            q: 'search'
        };
        validate(schema)(req, {}, next);
        expect(next).toHaveBeenCalledWith();
        expect(req.params.id).toBe(123);
        expect(req.query.q).toBe('search');
    });

    it('calls next with ApiError for query validation error', () => {
        const schema = {
            query: Joi.object({
                q: Joi.string().required()
            })
        };
        req.query = {};
        validate(schema)(req, {}, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: httpStatus.BAD_REQUEST,
                message: expect.stringContaining('q')
            })
        );
    });

    it('calls next with ApiError for params validation error', () => {
        const schema = {
            params: Joi.object({
                id: Joi.number().required()
            })
        };
        req.params = {};
        validate(schema)(req, {}, next);
        expect(next).toHaveBeenCalledWith(
            expect.objectContaining({
                statusCode: httpStatus.BAD_REQUEST,
                message: expect.stringContaining('id')
            })
        );
    });
});
