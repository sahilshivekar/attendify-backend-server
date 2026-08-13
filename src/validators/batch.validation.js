import Joi from 'joi';

const getBatches = {
    query: Joi.object().keys({
        semesterNumber: Joi.number().
        integer().
        positive().
        optional().
        messages({
            'number.base': 'Semester number must be a number',
            'number.integer': 'Semester number must be an integer',
            'number.positive': 'Semester number must be positive'
        }),
        branchId: Joi.string().
        uuid().
        optional().
        allow(null, '').
        messages({
            'string.guid': 'Branch ID must be a valid UUID',
            'string.base': 'Branch ID must be a string'
        }),
        divisionId: Joi.string().
        uuid().
        optional().
        allow(null, '').
        messages({
            'string.guid': 'Division ID must be a valid UUID',
            'string.base': 'Division ID must be a string'
        }),
        academicStartYear: Joi.number().
        integer().
        optional().
        messages({
            'number.base': 'Academic start year must be a number',
            'number.integer': 'Academic start year must be an integer'
        }),
        academicEndYear: Joi.number().
        integer().
        optional().
        messages({
            'number.base': 'Academic end year must be a number',
            'number.integer': 'Academic end year must be an integer'
        }),
        searchQuery: Joi.string().
        optional().
        allow(null, '').
        messages({
            'string.base': 'Search query must be a string'
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
        }),
        getAll: Joi.boolean().
        truthy('true').
        falsy('false').
        default(false).
        messages({
            'boolean.base': 'getAll must be a boolean value'
        })
    })
};

const getBatchById = {
    params: Joi.object().keys({
        id: Joi.string().
        uuid().
        required().
        messages({
            'string.guid': 'Batch ID must be a valid UUID',
            'any.required': 'Batch ID is required',
            'string.base': 'Batch ID must be a string'
        })
    })
};

const addBatch = {
    body: Joi.object().keys({
        batchCode: Joi.string().
        required().
        trim().
        messages({
            'any.required': 'Batch code is required',
            'string.empty': 'Batch code cannot be empty',
            'string.base': 'Batch code must be a string'
        }),
        divisionId: Joi.string().
        uuid().
        required().
        messages({
            'string.guid': 'Division ID must be a valid UUID',
            'any.required': 'Division ID is required',
            'string.base': 'Division ID must be a string'
        })
    })
};

const updateBatch = {
    params: Joi.object().keys({
        id: Joi.string().
        uuid().
        required().
        messages({
            'string.guid': 'Batch ID must be a valid UUID',
            'any.required': 'Batch ID is required',
            'string.base': 'Batch ID must be a string'
        })
    }),
    body: Joi.object().keys({
        batchCode: Joi.string().
        required().
        trim().
        messages({
            'any.required': 'Batch code is required',
            'string.empty': 'Batch code cannot be empty',
            'string.base': 'Batch code must be a string'
        })
    })
};

const removeBatch = {
    params: Joi.object().keys({
        id: Joi.string().
        uuid().
        required().
        messages({
            'string.guid': 'Batch ID must be a valid UUID',
            'any.required': 'Batch ID is required',
            'string.base': 'Batch ID must be a string'
        })
    })
};

export default {
    getBatches,
    getBatchById,
    addBatch,
    updateBatch,
    removeBatch
};
