import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const getUniversities = {};

const addUniversity = {
    body: Joi.object().keys({
        name: Joi.string().trim().min(1).max(100).required().messages({
            'any.required': 'University name is required',
            'string.min': 'Name must be at least 1 character',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        abbreviation: Joi.string().trim().max(20).allow('').messages({
            'string.max': 'Abbreviation cannot exceed 20 characters'
        })
    })
};

const updateUniversity = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'University ID is required',
            'string.guid': 'University ID must be a valid UUID'
        })
    }),
    body: Joi.object().keys({
        name: Joi.string().trim().min(1).max(100).messages({
            'string.min': 'Name must be at least 1 character',
            'string.max': 'Name cannot exceed 100 characters'
        }),
        abbreviation: Joi.string().trim().max(20).messages({
            'string.max': 'Abbreviation cannot exceed 20 characters'
        })
    }).min(1).messages({
        'object.min': 'Provide at least one field to update'
    })
};

const removeUniversity = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'University ID is required',
            'string.guid': 'University ID must be a valid UUID'
        })
    })
};

const getUniversityById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'University ID is required',
            'string.guid': 'University ID must be a valid UUID'
        })
    })
};

export default {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
};
