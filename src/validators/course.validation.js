import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const getCourses = {
    query: Joi.object().keys({
        searchQuery: Joi.string().allow('', null).default('').
        messages({
            'string.base': 'Search query must be a string'
        }),
        branchId: uuid.allow(null).
        messages({
            'string.guid': 'Branch ID must be a valid UUID'
        }),
        semesterNumber: Joi.number().integer().min(1).max(20).allow(null).
        messages({
            'number.base': 'Semester number must be a number',
            'number.integer': 'Semester number must be an integer',
            'number.min': 'Semester number must be at least 1',
            'number.max': 'Semester number cannot exceed 20'
        }),
        schemeId: uuid.allow(null).
        messages({
            'string.guid': 'Scheme ID must be a valid UUID'
        }),
        teacherIds: Joi.string().allow(null).
        custom((value, helpers) => {
            if (!value) return value;
            const ids = value.split(',').map((id) => id.trim());
            for (const id of ids) {
                const {
                    error
                } = uuid.validate(id);
                if (error) {
                    return helpers.error('any.invalid', {
                        message: 'All teacher IDs must be valid UUIDs'
                    });
                }
            }
            return value;
        }).
        messages({
            'any.invalid': 'All teacher IDs must be valid UUIDs'
        }),
        onlyOptional: Joi.boolean().default(false).
        messages({
            'boolean.base': 'onlyOptional must be a boolean'
        }),
        page: Joi.number().integer().min(1).default(1).
        messages({
            'number.base': 'Page must be a number',
            'number.min': 'Page must be at least 1'
        }),
        limit: Joi.number().integer().min(1).max(100).default(10).
        messages({
            'number.base': 'Limit must be a number',
            'number.min': 'Limit must be at least 1',
            'number.max': 'Limit cannot exceed 100'
        }),
        getAll: Joi.boolean().default(false).
        messages({
            'boolean.base': 'getAll must be a boolean'
        })
    })
};

const addCourse = {
    body: Joi.object().keys({
        code: Joi.string().trim().min(1).max(50).required().
        messages({
            'any.required': 'Course code is required',
            'string.min': 'Course code must be at least 1 character',
            'string.max': 'Course code cannot exceed 50 characters'
        }),
        name: Joi.string().trim().min(1).max(200).required().
        messages({
            'any.required': 'Course name is required',
            'string.min': 'Course name must be at least 1 character',
            'string.max': 'Course name cannot exceed 200 characters'
        }),
        courseType: Joi.string().valid('Lecture', 'Practical').required().
        messages({
            'any.required': 'Course type is required',
            'any.only': 'Course type must be either Lecture or Practical'
        }),
        optionalCourse: Joi.string().trim().allow(null, '').
        messages({
            'string.base': 'Optional course must be a string'
        }),
        schemeId: uuid.required().
        messages({
            'any.required': 'Scheme ID is required',
            'string.guid': 'Scheme ID must be a valid UUID'
        })
    })
};

const updateCourse = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        })
    }),
    body: Joi.object().keys({
        code: Joi.string().trim().min(1).max(50).
        messages({
            'string.min': 'Code must be at least 1 character',
            'string.max': 'Code cannot exceed 50 characters'
        }),
        name: Joi.string().trim().min(1).max(200).
        messages({
            'string.min': 'Name must be at least 1 character',
            'string.max': 'Name cannot exceed 200 characters'
        }),
        courseType: Joi.string().valid('Lecture', 'Practical').
        messages({
            'any.only': 'Course type must be either Lecture or Practical'
        }),
        optionalCourse: Joi.string().trim().allow(null, '').
        messages({
            'string.base': 'Optional course must be a string'
        }),
        schemeId: uuid.messages({
            'string.guid': 'Scheme ID must be a valid UUID'
        })
    }).min(1).messages({
        'object.min': 'Provide at least one field to update'
    })
};

const removeCourse = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        })
    })
};

const getCourseById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        })
    })
};

const addCourseToBranchWithSemesterNumber = {
    body: Joi.object().keys({
        courseId: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        }),
        branchId: uuid.required().messages({
            'any.required': 'Branch ID is required',
            'string.guid': 'Branch ID must be a valid UUID'
        }),
        semesterNumber: Joi.number().integer().min(1).max(20).required().
        messages({
            'any.required': 'Semester number is required',
            'number.base': 'Semester number must be a number',
            'number.min': 'Semester number must be at least 1',
            'number.max': 'Semester number cannot exceed 20'
        })
    })
};

const removeCourseFromBranchWithSemesterNumber = {
    params: Joi.object().keys({
        branchCourseSemesterId: uuid.required().messages({
            'any.required': 'BranchCourseSemester ID is required',
            'string.guid': 'BranchCourseSemester ID must be a valid UUID'
        })
    })
};

const bulkCreateCourses = {
    body: Joi.object().keys({
        courses: Joi.array().items(
            Joi.object().keys({
                code: Joi.string().trim().min(1).max(50).required().
                messages({
                    'any.required': 'Course code is required',
                    'string.min': 'Course code must be at least 1 character',
                    'string.max': 'Course code cannot exceed 50 characters'
                }),
                name: Joi.string().trim().min(1).max(200).required().
                messages({
                    'any.required': 'Course name is required',
                    'string.min': 'Course name must be at least 1 character',
                    'string.max': 'Course name cannot exceed 200 characters'
                }),
                courseType: Joi.string().valid('Lecture', 'Practical').required().
                messages({
                    'any.required': 'Course type is required',
                    'any.only': 'Course type must be either Lecture or Practical'
                }),
                optionalCourse: Joi.string().trim().allow(null, '').default(null).
                messages({
                    'string.base': 'Optional course must be a string'
                }),
                schemeId: uuid.required().
                messages({
                    'any.required': 'Scheme ID is required',
                    'string.guid': 'Scheme ID must be a valid UUID'
                })
            })
        ).min(1).max(100).required().
        messages({
            'any.required': 'Courses array is required',
            'array.min': 'At least 1 course is required',
            'array.max': 'Cannot create more than 100 courses at once'
        })
    })
};

const bulkDeleteCourses = {
    body: Joi.object().keys({
        courseIds: Joi.array().items(
            uuid.required().messages({
                'string.guid': 'Each course ID must be a valid UUID'
            })
        ).min(1).max(100).required().
        messages({
            'any.required': 'Course IDs array is required',
            'array.min': 'At least 1 course ID is required',
            'array.max': 'Cannot delete more than 100 courses at once'
        })
    })
};

const csvCourseRowSchema = Joi.object().keys({
    code: Joi.string().trim().min(1).max(50).required().
    messages({
        'any.required': 'Course code is required',
        'string.min': 'Course code must be at least 1 character',
        'string.max': 'Course code cannot exceed 50 characters'
    }),
    name: Joi.string().trim().min(1).max(200).required().
    messages({
        'any.required': 'Course name is required',
        'string.min': 'Course name must be at least 1 character',
        'string.max': 'Course name cannot exceed 200 characters'
    }),
    courseType: Joi.string().valid('Lecture', 'Practical').required().
    messages({
        'any.required': 'Course type is required',
        'any.only': 'Course type must be either Lecture or Practical'
    }),
    optionalCourse: Joi.string().trim().allow(null, '').messages({
        'string.base': 'Optional course must be a string'
    }),
    schemeId: uuid.required().messages({
        'any.required': 'Scheme ID is required',
        'string.guid': 'Scheme ID must be a valid UUID'
    })
});

const bulkCreateCoursesFromCSV = {

};

export default {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    getCourseById,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
    bulkCreateCourses,
    bulkDeleteCourses,
    bulkCreateCoursesFromCSV,
    csvCourseRowSchema
};
