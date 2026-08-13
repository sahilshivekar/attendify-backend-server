import Joi from 'joi';

const uuid = Joi.string().guid({
    version: ['uuidv4', 'uuidv5']
});

const addClass = {
    body: Joi.object().keys({
        teacherId: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({
            'string.pattern.base': 'Start time must be in HH:mm:ss format',
            'any.required': 'Start time is required'
        }),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({
            'string.pattern.base': 'End time must be in HH:mm:ss format',
            'any.required': 'End time is required'
        }),
        dayOfWeek: Joi.string().trim().required().messages({
            'any.required': 'Day of week is required'
        }),
        roomId: uuid.required().messages({
            'any.required': 'Room ID is required',
            'string.guid': 'Room ID must be a valid UUID'
        }),
        batchId: uuid.allow(null).messages({
            'string.guid': 'Batch ID must be a valid UUID'
        }),
        activeFrom: Joi.required().messages({
            'any.required': 'Active from date is required'
        }),
        activeTill: Joi.required().messages({
            'any.required': 'Active till date is required'
        }),
        courseId: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        }),
        timetableId: uuid.required().messages({
            'any.required': 'Timetable ID is required',
            'string.guid': 'Timetable ID must be a valid UUID'
        })
    })
};

const getClasses = {
    query: Joi.object().keys({
        searchQuery: Joi.string().allow('', null).default('').messages({
            'string.base': 'Search query must be a string'
        }),
        timetableId: uuid.allow(null).messages({
            'string.guid': 'Timetable ID must be a valid UUID'
        }),
        divisionId: uuid.allow(null).messages({
            'string.guid': 'Division ID must be a valid UUID'
        }),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).allow(null).messages({
            'string.pattern.base': 'Start time must be in HH:mm:ss format'
        }),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).allow(null).messages({
            'string.pattern.base': 'End time must be in HH:mm:ss format'
        }),
        activeFrom: Joi.allow(null).messages({
            'date.format': 'activeFrom must be a valid ISO date'
        }),
        activeTill: Joi.allow(null).messages({
            'date.format': 'activeTill must be a valid ISO date'
        }),
        teacherId: uuid.allow(null).messages({
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        dayOfWeek: Joi.string().trim().allow(null).messages({
            'string.base': 'Day of week must be a string'
        }),
        roomId: uuid.allow(null).messages({
            'string.guid': 'Room ID must be a valid UUID'
        }),
        batchId: uuid.allow(null).messages({
            'string.guid': 'Batch ID must be a valid UUID'
        }),
        courseType: Joi.string().allow(null).messages({
            'string.base': 'Course type must be a string'
        }),
        semesterId: uuid.allow(null).messages({
            'string.guid': 'Semester ID must be a valid UUID'
        }),
        semesterNumber: Joi.number().integer().allow(null).messages({
            'number.base': 'Semester number must be a number'
        }),
        academicStartYearOfSemester: Joi.number().integer().allow(null).messages({
            'number.base': 'Academic start year must be a number'
        }),
        academicEndYearOfSemester: Joi.number().integer().allow(null).messages({
            'number.base': 'Academic end year must be a number'
        }),
        branchId: uuid.allow(null).messages({
            'string.guid': 'Branch ID must be a valid UUID'
        }),
        isExtraClass: Joi.boolean().default(false).messages({
            'boolean.base': 'isExtraClass must be a boolean'
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
        })
    })
};

const getStudentsUpcomingClasses = {
    query: Joi.object().max(0)
};

const getTeachersUpcomingClasses = {
    query: Joi.object().max(0)
};

const getClassById = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Class ID is required',
            'string.guid': 'Class ID must be a valid UUID'
        })
    })
};

const editActiveDatesOfClass = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Class ID is required',
            'string.guid': 'Class ID must be a valid UUID'
        })
    }),
    body: Joi.object().keys({
        newActiveFrom: Joi.optional(),
        newActiveTill: Joi.optional()
    }).or('newActiveFrom', 'newActiveTill').messages({
        'object.missing': 'At least one of newActiveFrom or newActiveTill is required'
    })
};

const removeClass = {
    params: Joi.object().keys({
        id: uuid.required().messages({
            'any.required': 'Class ID is required',
            'string.guid': 'Class ID must be a valid UUID'
        })
    })
};

const addExtraClass = {
    body: Joi.object().keys({
        teacherId: uuid.required().messages({
            'any.required': 'Teacher ID is required',
            'string.guid': 'Teacher ID must be a valid UUID'
        }),
        startTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({
            'string.pattern.base': 'Start time must be in HH:mm:ss format',
            'any.required': 'Start time is required'
        }),
        endTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).required().messages({
            'string.pattern.base': 'End time must be in HH:mm:ss format',
            'any.required': 'End time is required'
        }),
        dayOfWeek: Joi.string().trim().required().messages({
            'any.required': 'Day of week is required'
        }),
        roomId: uuid.required().messages({
            'any.required': 'Room ID is required',
            'string.guid': 'Room ID must be a valid UUID'
        }),
        batchId: uuid.allow(null).messages({
            'string.guid': 'Batch ID must be a valid UUID'
        }),
        activeFrom: Joi.required().messages({
            'any.required': 'Active from date is required'
        }),
        activeTill: Joi.required().messages({
            'any.required': 'Active till date is required'
        }),
        courseId: uuid.required().messages({
            'any.required': 'Course ID is required',
            'string.guid': 'Course ID must be a valid UUID'
        }),
        timetableId: uuid.required().messages({
            'any.required': 'Timetable ID is required',
            'string.guid': 'Timetable ID must be a valid UUID'
        })
    })
};

const getCancelledClasses = {
    query: Joi.object().keys({
        divisionId: uuid.allow(null).messages({
            'string.guid': 'Division ID must be a valid UUID'
        }),
        batchId: uuid.allow(null).messages({
            'string.guid': 'Batch ID must be a valid UUID'
        }),
        date: Joi.date().allow(null).messages({
            'date.format': 'Date must be a valid ISO date'
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
        })
    })
};

const cancelClass = {
    body: Joi.object().keys({
        classId: uuid.required().messages({
            'any.required': 'Class ID is required',
            'string.guid': 'Class ID must be a valid UUID'
        }),
        date: Joi.date().required().messages({
            'any.required': 'Date is required'
        }),
        reason: Joi.string().allow('', null).messages({
            'string.base': 'Reason must be a string'
        })
    })
};

const bulkCreateClasses = {
    body: Joi.object().keys({
        classes: Joi.array().items(
            Joi.object().keys({
                teacherId: Joi.string().guid().required().messages({
                    'any.required': 'Teacher ID is required',
                    'string.guid': 'Teacher ID must be a valid UUID'
                }),
                startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
                    'any.required': 'Start time is required',
                    'string.pattern.base': 'Start time must be in HH:MM format'
                }),
                endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
                    'any.required': 'End time is required',
                    'string.pattern.base': 'End time must be in HH:MM format'
                }),
                dayOfWeek: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required().messages({
                    'any.required': 'Day of week is required',
                    'any.only': 'Day of week must be a valid day'
                }),
                roomId: Joi.string().guid().required().messages({
                    'any.required': 'Room ID is required',
                    'string.guid': 'Room ID must be a valid UUID'
                }),
                batchId: Joi.string().guid().allow(null).messages({
                    'string.guid': 'Batch ID must be a valid UUID'
                }),
                activeFrom: Joi.date().required().messages({
                    'any.required': 'Active from date is required'
                }),
                activeTill: Joi.date().required().messages({
                    'any.required': 'Active till date is required'
                }),
                courseId: Joi.string().guid().required().messages({
                    'any.required': 'Course ID is required',
                    'string.guid': 'Course ID must be a valid UUID'
                }),
                timetableId: Joi.string().guid().required().messages({
                    'any.required': 'Timetable ID is required',
                    'string.guid': 'Timetable ID must be a valid UUID'
                }),
                isExtraClass: Joi.boolean().default(false).messages({
                    'boolean.base': 'isExtraClass must be a boolean'
                })
            })
        ).min(1).required().messages({
            'any.required': 'Classes array is required',
            'array.min': 'At least one class is required'
        })
    })
};

const bulkDeleteClasses = {
    body: Joi.object().keys({
        classIds: Joi.array().items(
            Joi.string().guid().messages({
                'string.guid': 'Each class ID must be a valid UUID',
                'string.empty': 'Each class ID must be a valid UUID',
                'string.base': 'Each class ID must be a valid UUID'
            })
        ).min(1).required().messages({
            'any.required': 'Class IDs array is required',
            'array.min': 'At least one class ID is required'
        })
    })
};

const bulkCreateClassesFromCSV = {

    body: Joi.object().keys({}).allow({})
};

export default {
    addClass,
    getClasses,
    getStudentsUpcomingClasses,
    getTeachersUpcomingClasses,
    getClassById,
    editActiveDatesOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass,
    bulkCreateClasses,
    bulkDeleteClasses,
    bulkCreateClassesFromCSV
};
