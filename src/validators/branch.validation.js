import Joi from 'joi';

const getBranches = {
    query: Joi.object().keys({
        searchQuery: Joi.string().
        allow('', null).
        default('').
        messages({
            'string.base': 'Search query must be a string'
        })
    })
};

const addBranch = {
    body: Joi.object().keys({
        name: Joi.string().
        trim().
        min(1).
        max(100).
        required().
        messages({
            'string.base': 'Name must be a string',
            'any.required': 'Name is required',
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 1 character long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        abbreviation: Joi.string().
        trim().
        max(20).
        required().
        messages({
            'string.base': 'Abbreviation must be a string',
            'any.required': 'Abbreviation is required',
            'string.empty': 'Abbreviation cannot be empty',
            'string.max': 'Abbreviation cannot exceed 20 characters'
        })
    })
};

const updateBranch = {
    params: Joi.object().keys({
        id: Joi.string().
        guid({
            version: ['uuidv4', 'uuidv5']
        }).
        required().
        messages({
            'string.base': 'Id must be a string',
            'any.required': 'Id is required',
            'string.guid': 'Id must be a valid UUID'
        })
    }),
    body: Joi.object().
    keys({
        name: Joi.string().
        trim().
        min(1).
        max(100).
        messages({
            'string.base': 'Name must be a string',
            'string.empty': 'Name cannot be empty',
            'string.min': 'Name must be at least 1 character long',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        abbreviation: Joi.string().
        trim().
        allow('').
        max(20).
        messages({
            'string.base': 'Abbreviation must be a string',
            'string.max': 'Abbreviation cannot exceed 20 characters'
        })
    }).
    min(1).
    messages({
        'object.min': 'Provide at least one field to update'
    })
};

const removeBranch = {
    params: Joi.object().keys({
        id: Joi.string().
        guid({
            version: ['uuidv4', 'uuidv5']
        }).
        required().
        messages({
            'string.base': 'Id must be a string',
            'any.required': 'Id is required',
            'string.guid': 'Id must be a valid UUID'
        })
    })
};

const getBranchById = {
    params: Joi.object().keys({
        id: Joi.string().
        guid({
            version: ['uuidv4', 'uuidv5']
        }).
        required().
        messages({
            'string.base': 'Id must be a string',
            'any.required': 'Id is required',
            'string.guid': 'Id must be a valid UUID'
        })
    })
};

export default {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
};
