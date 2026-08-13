import Joi from 'joi';

const sendVerificationCodeToEmail = {
    body: Joi.object().keys({
        email: Joi.string().
        email().
        optional().
        lowercase().
        allow('').
        messages({
            'string.email': 'Please provide a valid email address',
            'string.base': 'Email must be a string'
        })
    })
};

const verifyCode = {
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
        code: Joi.string().
        required().
        trim().
        messages({
            'any.required': 'Verification code is required',
            'string.empty': 'Verification code cannot be empty',
            'string.base': 'Verification code must be a string'
        })
    })
};

const verifyPassword = {
    body: Joi.object().keys({
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

const updateAdminPassword = {
    body: Joi.object().keys({
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
        }),
        confirmPassword: Joi.string().
        required().
        valid(Joi.ref('password')).
        messages({
            'any.required': 'Confirm password is required',
            'string.empty': 'Confirm password cannot be empty',
            'string.base': 'Confirm password must be a string',
            'any.only': 'Password and confirm password must match'
        })
    })
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().
        required().
        messages({
            'any.required': 'Refresh token is required',
            'string.empty': 'Refresh token cannot be empty',
            'string.base': 'Refresh token must be a string'
        })
    })
};

const login = {
    body: Joi.object().keys({
        emailOrUsername: Joi.string().
        required().
        messages({
            'any.required': 'Email or username is required',
            'string.empty': 'Email or username cannot be empty',
            'string.base': 'Email or username must be a string'
        }),
        password: Joi.string().
        required().
        messages({
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty',
            'string.base': 'Password must be a string'
        })
    })
};

export default {
    login,
    updateAdminPassword,
    verifyPassword,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens
};
