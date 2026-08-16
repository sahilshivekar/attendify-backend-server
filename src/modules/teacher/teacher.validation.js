import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const getTeacher = {
    query: Joi.object().keys({
        searchQuery: Joi.string().allow('', null).default('').messages({
            'string.base': 'Search query must be a string'
        }),
        courseId: uuid.allow(null).messages({
            'string.guid': 'Course ID must be a valid UUID'
        }),
        page: Joi.number().integer().min(1).default(1).messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),
        limit: Joi.number().integer().min(1).max(100).default(10).messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
        getAll: Joi.boolean().default(false).messages({
            'boolean.base': 'getAll must be a boolean'
        }),
        isActive: Joi.boolean().default(false).messages({
            'boolean.base': 'isActive must be a boolean'
        })
    })
};

const getTeacherById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        })
    })
};

const addTeacher = {
    body: Joi.object().keys({
        firstName: Joi.string().trim().min(1).max(100).required().messages({
            'any.required': 'First name is required',
            'string.min': 'First name must be at least 1 character',
            'string.max': 'First name cannot exceed 100 characters'
        }),
        middleName: Joi.string().allow('', null).messages({
            'string.base': 'Middle name must be a string'
        }),
        lastName: Joi.string().trim().min(1).max(100).required().messages({
            'any.required': 'Last name is required',
            'string.min': 'Last name must be at least 1 character',
            'string.max': 'Last name cannot exceed 100 characters'
        }),
        email: Joi.string().email().required().messages({
            'any.required': 'Email is required',
            'string.email': 'Please provide a valid email address'
        }),
        phoneNumber: Joi.string().trim().required().messages({
            'any.required': 'Phone number is required'
        }),
        gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
            'any.required': 'Gender is required',
            'any.only': "Gender must be one of 'Male', 'Female', or 'Other'"
        }),
        highestQualification: Joi.string().allow('', null).messages({
            'string.base': 'Highest qualification must be a string'
        }),
        role: Joi.string().valid('Teacher', 'Head of Department', 'Principal').required().messages({
            'any.required': 'Role is required',
            'any.only': "Role must be 'Teacher', 'Head of Department', or 'Principal'"
        }),
        isActive: Joi.boolean().default(true).messages({
            'boolean.base': 'isActive must be a boolean'
        })
    })
};

const updateTeacherDetails = {
    body: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        firstName: Joi.string().trim().min(1).max(100).messages({
            'string.min': 'First name must be at least 1 character',
            'string.max': 'First name cannot exceed 100 characters'
        }),
        middleName: Joi.string().allow('', null).messages({
            'string.base': 'Middle name must be a string'
        }),
        lastName: Joi.string().trim().min(1).max(100).messages({
            'string.min': 'Last name must be at least 1 character',
            'string.max': 'Last name cannot exceed 100 characters'
        }),
        email: Joi.string().email().messages({
            'string.email': 'Please provide a valid email address'
        }),
        role: Joi.string().valid('Teacher', 'Head of Department', 'Principal').messages({
            'any.only': "Role must be 'Teacher', 'Head of Department', or 'Principal'"
        }),
        gender: Joi.string().valid('Male', 'Female', 'Other').messages({
            'any.only': "Gender must be one of 'Male', 'Female', or 'Other'"
        }),
        highestQualification: Joi.string().messages({
            'string.base': 'Highest qualification must be a string'
        }),
        phoneNumber: Joi.string().trim().messages({
            'string.base': 'Phone number must be a string'
        }),
        isActive: Joi.boolean().messages({
            'boolean.base': 'isActive must be a boolean'
        })
    }).min(1).messages({
        'object.min': 'Provide at least one field to update'
    })
};

const updateTeacherPassword = {
    body: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        password: Joi.string().min(8).max(128).required().messages({
            'any.required': 'Password is required',
            'string.min': 'Password must be at least 8 characters',
            'string.max': 'Password cannot exceed 128 characters'
        }),
        confirmPassword: Joi.any().valid(Joi.ref('password')).required().messages({
            'any.only': 'Password and confirm password must match',
            'any.required': 'Confirm password is required'
        })
    })
};

const updateTeacherImage = {
    body: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        })
    })
};

const removeImage = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        })
    })
};

const removeTeacher = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        })
    })
};

const getTeachingCourses = {
    query: Joi.object().keys({
        teacherId: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        })
    })
};

const addTeachingCourse = {
    body: Joi.object().keys({
        teacherId: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        courseId: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        })
    })
};

const removeTeachingCourse = {
    params: Joi.object().keys({
        teacherTeachesCourseId: uuid.required().messages({
            'any.required': 'TeacherTeachesCourse ID is required',
            'string.guid': 'TeacherTeachesCourse ID must be a valid UUID'
        })
    })
};

const bulkCreateTeachers = {
    body: Joi.object().keys({
        teachers: Joi.array().items(
            Joi.object().keys({
                firstName: Joi.string().trim().min(1).max(100).required().messages({
                    'any.required': 'First name is required',
                    'string.min': 'First name must be at least 1 character',
                    'string.max': 'First name cannot exceed 100 characters'
                }),
                middleName: Joi.string().allow('', null).messages({
                    'string.base': 'Middle name must be a string'
                }),
                lastName: Joi.string().trim().min(1).max(100).required().messages({
                    'any.required': 'Last name is required',
                    'string.min': 'Last name must be at least 1 character',
                    'string.max': 'Last name cannot exceed 100 characters'
                }),
                email: Joi.string().email().required().messages({
                    'any.required': 'Email is required',
                    'string.email': 'Please provide a valid email address'
                }),
                phoneNumber: Joi.string().trim().required().messages({
                    'any.required': 'Phone number is required'
                }),
                gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
                    'any.required': 'Gender is required',
                    'any.only': "Gender must be one of 'Male', 'Female', or 'Other'"
                }),
                highestQualification: Joi.string().allow('', null).messages({
                    'string.base': 'Highest qualification must be a string'
                }),
                role: Joi.string().trim().required().messages({
                    'any.required': 'Role is required'
                }),
                isActive: Joi.boolean().default(true).messages({
                    'boolean.base': 'isActive must be a boolean'
                })
            })
        ).min(1).required().messages({
            'any.required': 'Teachers array is required',
            'array.min': 'At least one teacher is required'
        })
    })
};

const bulkDeleteTeachers = {
    body: Joi.object().keys({
        teacherIds: Joi.array().items(uuid.messages({
            'string.guid': 'Each teacher ID must be a valid UUID'
        })).min(1).required().messages({
            'any.required': 'Teacher IDs array is required',
            'array.min': 'At least one teacher ID is required'
        })
    })
};

const csvTeacherRowSchema = Joi.object().keys({
    firstName: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'First name is required',
        'string.min': 'First name must be at least 1 character',
        'string.max': 'First name cannot exceed 100 characters'
    }),
    middleName: Joi.string().allow('', null).messages({
        'string.base': 'Middle name must be a string'
    }),
    lastName: Joi.string().trim().min(1).max(100).required().messages({
        'any.required': 'Last name is required',
        'string.min': 'Last name must be at least 1 character',
        'string.max': 'Last name cannot exceed 100 characters'
    }),
    email: Joi.string().email().required().messages({
        'any.required': 'Email is required',
        'string.email': 'Please provide a valid email address'
    }),
    phoneNumber: Joi.string().trim().required().messages({
        'any.required': 'Phone number is required'
    }),
    gender: Joi.string().valid('Male', 'Female', 'Other').required().messages({
        'any.required': 'Gender is required',
        'any.only': "Gender must be one of 'Male', 'Female', or 'Other'"
    }),
    highestQualification: Joi.string().allow('', null).messages({
        'string.base': 'Highest qualification must be a string'
    }),
    role: Joi.string().valid('Teacher', 'Head of Department', 'Principal').required().messages({
        'any.required': 'Role is required',
        'any.only': "Role must be 'Teacher', 'Head of Department', or 'Principal'"
    }),
    isActive: Joi.boolean().default(true).messages({
        'boolean.base': 'isActive must be a boolean'
    })
});

const bulkCreateTeachersFromCSV = {

};

export default {
    getTeacher,
    getTeacherById,
    addTeacher,
    updateTeacherDetails,
    updateTeacherPassword,
    updateTeacherImage,
    removeImage,
    removeTeacher,
    getTeachingCourses,
    addTeachingCourse,
    removeTeachingCourse,
    bulkCreateTeachers,
    bulkDeleteTeachers,
    bulkCreateTeachersFromCSV,
    csvTeacherRowSchema
};
