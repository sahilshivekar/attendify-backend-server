import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const getSchemes = {
    query: Joi.object().keys({
        searchQuery: Joi.string().allow('', null).default('').
        messages({
            'string.base': 'Search query must be a string'
        })
    })
};

const addScheme = {
    body: Joi.object().keys({
        name: Joi.string().trim().min(1).max(100).required().
        messages({
            'any.required': 'Scheme name is required',
            'string.min': 'Name must be at least 1 character',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        universityId: uuid.required().messages({
            'any.required': 'University ID is required',
            'string.guid': 'University ID must be a valid UUID'
        })
    })
};

const updateScheme = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Scheme ID is required',
            'string.guid': 'Scheme ID must be a valid UUID'
        })
    }),
    body: Joi.object().keys({
        name: Joi.string().trim().min(1).max(100).
        messages({
            'string.min': 'Name must be at least 1 character',
            'string.max': 'Name cannot exceed 100 characters'
        })
    }).min(1).messages({
        'object.min': 'Provide at least one field to update'
    })
};

const removeScheme = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Scheme ID is required',
            'string.guid': 'Scheme ID must be a valid UUID'
        })
    })
};

const getSchemeById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Scheme ID is required',
            'string.guid': 'Scheme ID must be a valid UUID'
        })
    })
};

export default {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
};
