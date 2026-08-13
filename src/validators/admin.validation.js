import Joi from 'joi';

const addAdmin = {
    body: Joi.object().keys({
        email: Joi.string().
        email().
        required().
        lowercase().
        messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
            'string.empty': 'Email cannot be empty',
            'string.base': 'Email must be a string'
        }),
        username: Joi.string().
        min(3).
        max(30).
        required().
        messages({
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'any.required': 'Username is required',
            'string.empty': 'Username cannot be empty',
            'string.base': 'Username must be a string'
        }),
        password: Joi.string().
        max(128).
        required().
        custom((value, helpers) => {
            if (!/[A-Z]/.test(value)) {
                throw new Error('Password must contain at least one uppercase letter');
            }
            if (!/\d/.test(value)) {
                throw new Error('Password must contain at least one number');
            }
            if (!/[^\w]/.test(value)) {
                throw new Error('Password must contain at least one special character');
            }
            if (/\s/.test(value)) {
                throw new Error('Password cannot contain spaces');
            }
            if (value.length < 8) {
                throw new Error('Password must be at least 8 characters long');
            }
            return value;
        }).
        messages({
            'string.max': 'Password cannot exceed 128 characters',
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty',
            'string.base': 'Password must be a string'
        })
    })
};

const updateAdminDetails = {
    body: Joi.object().keys({
        email: Joi.string().
        email().
        required().
        lowercase().
        messages({
            'string.email': 'Please provide a valid email address',
            'any.required': 'Email is required',
            'string.empty': 'Email cannot be empty',
            'string.base': 'Email must be a string'
        }),
        username: Joi.string().
        min(3).
        max(30).
        required().
        messages({
            'string.min': 'Username must be at least 3 characters long',
            'string.max': 'Username cannot exceed 30 characters',
            'any.required': 'Username is required',
            'string.empty': 'Username cannot be empty',
            'string.base': 'Username must be a string'
        })
    })
};

const getAdmins = {
    query: Joi.object().keys({
        searchQuery: Joi.string().
        allow('', null).
        default('').
        messages({
            'string.base': 'Search query must be a string'
        }),
        sortBy: Joi.string().
        valid('username', 'email', 'createdAt', 'updatedAt').
        default('createdAt').
        messages({
            'any.only': 'Invalid sortBy parameter. Valid options are: username, email, createdAt, updatedAt',
            'string.base': 'Sort by must be a string'
        }),
        sortOrder: Joi.string().
        valid('ASC', 'DESC').
        default('ASC').
        messages({
            'any.only': 'Invalid sortOrder parameter. Valid options are: ASC, DESC',
            'string.base': 'Sort order must be a string'
        }),
        page: Joi.number().
        integer().
        min(1).
        default(1).
        messages({
            'number.base': 'Page must be a number',
            'number.integer': 'Page must be an integer',
            'number.min': 'Page must be greater than 0'
        }),
        limit: Joi.number().
        integer().
        min(1).
        max(100).
        default(10).
        messages({
            'number.base': 'Limit must be a number',
            'number.integer': 'Limit must be an integer',
            'number.min': 'Limit must be greater than 0',
            'number.max': 'Limit cannot exceed 100'
        })
    })
};

export default {
    addAdmin,
    updateAdminDetails,
    getAdmins
};
