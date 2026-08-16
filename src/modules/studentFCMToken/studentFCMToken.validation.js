import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const upsertStudentFCMToken = {
    body: Joi.object().keys({
        studentId: uuid.required().messages({
            'any.required': 'Student ID is required',
            'string.guid': 'Student ID must be a valid UUID'
        }),
        fcmToken: Joi.string().min(10).required().messages({
            'any.required': 'FCM token is required',
            'string.min': 'FCM token must be at least 10 characters'
        }),
        deviceId: Joi.string().required().messages({
            'any.required': 'Device ID is required'
        }),
        deviceModel: Joi.string().allow(null, '').optional().messages({
            'string.base': 'Device model must be a string'
        }),
        osVersion: Joi.string().allow(null, '').optional().messages({
            'string.base': 'OS version must be a string'
        }),
        appVersion: Joi.string().allow(null, '').optional().messages({
            'string.base': 'App version must be a string'
        }),
        deviceType: Joi.string().valid('ANDROID', 'IOS').required().messages({
            'any.required': 'Device type is required',
            'any.only': 'Device type must be either ANDROID or IOS'
        })
    })
};

const removeStudentFCMTokens = {
    query: Joi.object().keys({
        studentId: uuid.required().messages({
            'any.required': 'Student ID is required',
            'string.guid': 'Student ID must be a valid UUID'
        }),
        deviceId: Joi.string().required().messages({
            'any.required': 'Device ID is required'
        })
    })
};

export default {
    upsertStudentFCMToken,
    removeStudentFCMTokens
};
