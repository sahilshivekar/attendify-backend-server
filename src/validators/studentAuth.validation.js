import Joi from 'joi';

const loginStudent = {
    body: Joi.object().keys({
        emailOrPRN: Joi.string().required().messages({
            'any.required': 'Email or PRN is required'
        }),
        password: Joi.string().required().messages({
            'any.required': 'Password is required',
            'string.empty': 'Password cannot be empty',
            'string.base': 'Password must be a string'
        })
    })
};

const sendVerificationCodeToEmail = {
    body: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'any.required': 'Email is required',
            'string.email': 'Please provide a valid email address'
        })
    })
};

const refreshTokens = {
    body: Joi.object().keys({
        refreshToken: Joi.string().required().messages({
            'any.required': 'Refresh token is required'
        })
    })
};

const updateStudentPassword = {
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
        confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
            'any.only': 'Password and confirm password must match',
            'any.required': 'Confirm password is required'
        })
    })
};

const verifyCode = {
    body: Joi.object().keys({
        email: Joi.string().email().required().messages({
            'any.required': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
        code: Joi.string().length(6).required().messages({
            'any.required': 'Code is required',
            'string.length': 'Code must be 6 characters long'
        })
    })
};

export default {
    loginStudent,
    sendVerificationCodeToEmail,
    refreshTokens,
    updateStudentPassword,
    verifyCode
};
