import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const addStudentToDropout = {
    body: Joi.object().keys({
        studentId: uuid.required().messages({
            'any.required': 'Student ID is required',
            'string.guid': 'Student ID must be a valid UUID'
        }),
        academicStartYear: Joi.number().integer().min(1900).max(3000).required().messages({
            'any.required': 'Academic start year is required',
            'number.base': 'Academic start year must be a number'
        }),
        academicEndYear: Joi.number().integer().min(1900).max(3000).required().messages({
            'any.required': 'Academic end year is required',
            'number.base': 'Academic end year must be a number'
        })
    })
};

const removeStudentFromDropout = {
    query: Joi.object().keys({
        studentId: uuid.required().messages({
            'any.required': 'Student ID is required',
            'string.guid': 'Student ID must be a valid UUID'
        }),
        academicStartYear: Joi.number().integer().min(1900).max(3000).required().messages({
            'any.required': 'Academic start year is required',
            'number.base': 'Academic start year must be a number'
        }),
        academicEndYear: Joi.number().integer().min(1900).max(3000).required().messages({
            'any.required': 'Academic end year is required',
            'number.base': 'Academic end year must be a number'
        })
    })
};

const getDropoutById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Dropout ID is required',
            'string.guid': 'Dropout ID must be a valid UUID'
        })
    })
};

const getDropoutDetailsOfStudent = {
    query: Joi.object().keys({
        studentId: uuid.required().messages({
            'any.required': 'Student ID is required',
            'string.guid': 'Student ID must be a valid UUID'
        })
    })
};

export default {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
};
