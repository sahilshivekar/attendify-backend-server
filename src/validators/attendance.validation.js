import Joi from 'joi';


const createAttendance = {
    body: Joi.object().keys({
        classId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.base': 'Class ID must be a string',
                'string.guid': 'Class ID must be a valid UUID',
                'any.required': 'Class ID is required'
            }),
        date: Joi.string()
            .required()
            .custom((value, helpers) => {
                // Validate YYYY-MM-DD format using regex
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (!dateRegex.test(value)) {
                    throw new Error('Date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }

                return value;
            })
            .messages({
                'any.required': 'Date is required',
                'string.empty': 'Date cannot be empty',
                'string.base': 'Date must be a string'
            }),
    })
};

// validations/attendance.validation.js
const updateStudentAttendance = {
    body: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            }),
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        newAttendanceStatus: Joi.boolean()
            .required()
            .messages({
                'boolean.base': 'New attendance status must be a boolean',
                'any.required': 'New attendance status is required'
            })
    })
};

const markMyAttendance = {
    body: Joi.object().keys({
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            })
    })
};

const bulkUpdateStudentAttendance = {
    body: Joi.object().keys({
        attendanceUpdates: Joi.array().items(
            Joi.object().keys({
                attendanceId: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.guid': 'Attendance ID must be a valid UUID',
                        'any.required': 'Attendance ID is required',
                        'string.base': 'Attendance ID must be a string'
                    }),
                studentId: Joi.string()
                    .uuid()
                    .required()
                    .messages({
                        'string.guid': 'Student ID must be a valid UUID',
                        'any.required': 'Student ID is required',
                        'string.base': 'Student ID must be a string'
                    }),
                newAttendanceStatus: Joi.boolean()
                    .required()
                    .messages({
                        'boolean.base': 'New attendance status must be a boolean',
                        'any.required': 'New attendance status is required'
                    })
            })
        ).min(1).max(200).required()
            .messages({
                'any.required': 'Attendance updates array is required',
                'array.min': 'At least 1 attendance update is required',
                'array.max': 'Cannot update more than 200 attendance records at once'
            })
    })
};

const removeAttendance = {
    query: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string',
                'string.empty': 'Attendance ID cannot be empty'
            })
    })
};

// validations/attendance.validation.js
const getAttendanceOfAnyStudentForSpecificCourseInSemester = {
    query: Joi.object().keys({
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'any.required': 'Course ID is required',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;

            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            }),
        semesterNumber: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicStartYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicEndYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        branchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Branch ID must be a valid UUID',
                'string.base': 'Branch ID must be a string'
            }),
        schemeId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Scheme ID must be a valid UUID',
                'string.base': 'Scheme ID must be a string'
            })
    })
};

const getAttendanceOfEveryStudentForSpecificCourseInSemester = {
    query: Joi.object().keys({
        studentIds: Joi.alternatives()
            .try(
                Joi.array().items(
                    Joi.string()
                        .uuid()
                        .messages({
                            'string.guid': 'Each student ID must be a valid UUID',
                            'string.base': 'Each student ID must be a string'
                        })
                ),
                Joi.string().uuid().messages({
                    'string.guid': 'Student ID must be a valid UUID',
                    'string.base': 'Student ID must be a string'
                })
            )
            .required()
            .messages({
                'any.required': 'Student IDs are required'
            }),
        courseId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'any.required': 'Course ID is required',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, ''),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, ''),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, ''),
        startDate: Joi.string().optional().allow(null, '').custom((value) => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (value && !dateRegex.test(value)) {
                throw new Error('Start date must be in YYYY-MM-DD format');
            }
            return value;
        }),
        endDate: Joi.string().optional().allow(null, '').custom((value) => {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (value && !dateRegex.test(value)) {
                throw new Error('End date must be in YYYY-MM-DD format');
            }
            return value;
        }),
        semesterNumber: Joi.number().integer().optional().allow(null),
        academicStartYear: Joi.number().integer().optional().allow(null),
        academicEndYear: Joi.number().integer().optional().allow(null),
        branchId: Joi.string().uuid().optional().allow(null, ''),
        schemeId: Joi.string().uuid().optional().allow(null, '')
    })
};

const getAttendanceOfSelfForSpecificCourseInSemester = {
    query: Joi.object().keys({
        courseId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'any.required': 'Course ID is required',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            }),
        semesterNumber: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicStartYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicEndYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        branchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Branch ID must be a valid UUID',
                'string.base': 'Branch ID must be a string'
            }),
        schemeId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Scheme ID must be a valid UUID',
                'string.base': 'Scheme ID must be a string'
            })
    })
};

const getAttendanceOfAllForSemesterDivisionBatchCourse = {
    query: Joi.object().keys({
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'string.base': 'Course ID must be a string'
            }),
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            }),
        semesterNumber: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicStartYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        academicEndYear: Joi.number()
            .integer()
            .optional()
            .allow(null),
        branchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Branch ID must be a valid UUID',
                'string.base': 'Branch ID must be a string'
            }),
        schemeId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Scheme ID must be a valid UUID',
                'string.base': 'Scheme ID must be a string'
            })
    })
};

// validations/attendance.validation.js
const sendAttendanceReport = {
    body: Joi.object().keys({
        startDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Start date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Start date must be a string'
            }),
        endDate: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('End date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'End date must be a string'
            }),
        studentIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each student ID must be a valid UUID',
                'string.base': 'Each student ID must be a string'
            }))
            .optional()
            .messages({
                'array.base': 'Student IDs must be an array'
            }),
        courseIds: Joi.array()
            .items(Joi.string().uuid().messages({
                'string.guid': 'Each course ID must be a valid UUID',
                'string.base': 'Each course ID must be a string'
            }))
            .optional()
            .messages({
                'array.base': 'Course IDs must be an array'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            })
    }).custom((value, helpers) => {
        if (!value.studentIds && !value.courseIds && !value.semesterId) {
            throw new Error('At least one of studentIds, courseIds, or semesterId is required');
        }
        return value;
    })
};

const getAttendanceById = {
    params: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            })
    })
};

const getAttendances = {
    query: Joi.object().keys({
        date: Joi.string()
            .optional()
            .allow(null, '')
            .custom((value, helpers) => {
                const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
                if (value && !dateRegex.test(value)) {
                    throw new Error('Date must be in YYYY-MM-DD format');
                }
                const [year, month, day] = value.split('-').map(Number);
                if (month < 1 || month > 12 || day < 1 || day > 31) {
                    throw new Error('Invalid date provided');
                }
                return value;
            })
            .messages({
                'string.base': 'Date must be a string'
            }),
        classId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Class ID must be a valid UUID',
                'string.base': 'Class ID must be a string'
            }),
        studentId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'string.base': 'Student ID must be a string'
            }),
        courseId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Course ID must be a valid UUID',
                'string.base': 'Course ID must be a string'
            }),
        semesterId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Semester ID must be a valid UUID',
                'string.base': 'Semester ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'string.base': 'Division ID must be a string'
            }),
        batchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Batch ID must be a valid UUID',
                'string.base': 'Batch ID must be a string'
            }),
        branchId: Joi.string()
            .uuid()
            .optional()
            .allow(null, '')
            .messages({
                'string.guid': 'Branch ID must be a valid UUID',
                'string.base': 'Branch ID must be a string'
            }),
        semesterNumber: Joi.number()
            .integer()
            .optional()
            .allow(null)
            .messages({
                'number.base': 'Semester number must be a number',
                'number.integer': 'Semester number must be an integer'
            }),
        academicStartYear: Joi.number()
            .integer()
            .optional()
            .allow(null)
            .messages({
                'number.base': 'Academic start year must be a number',
                'number.integer': 'Academic start year must be an integer'
            }),
        academicEndYear: Joi.number()
            .integer()
            .optional()
            .allow(null)
            .messages({
                'number.base': 'Academic end year must be a number',
                'number.integer': 'Academic end year must be an integer'
            }),
        page: Joi.number()
            .integer()
            .min(1)
            .optional()
            .default(1)
            .messages({
                'number.base': 'Page must be a number',
                'number.integer': 'Page must be an integer',
                'number.min': 'Page must be at least 1'
            }),
        limit: Joi.number()
            .integer()
            .min(1)
            .max(100)
            .optional()
            .default(10)
            .messages({
                'number.base': 'Limit must be a number',
                'number.integer': 'Limit must be an integer',
                'number.min': 'Limit must be at least 1',
                'number.max': 'Limit cannot exceed 100'
            })
    })
};

const getActiveAttendanceSheet = {
    query: Joi.object().keys({
        studentId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Student ID must be a valid UUID',
                'any.required': 'Student ID is required',
                'string.base': 'Student ID must be a string'
            }),
        divisionId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Division ID must be a valid UUID',
                'any.required': 'Division ID is required',
                'string.base': 'Division ID must be a string'
            })
    })
};

const groupPhotoScan = {
    body: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            })
    })
};

const markAllPresentOrAbsent = {
    body: Joi.object().keys({
        attendanceId: Joi.string()
            .uuid()
            .required()
            .messages({
                'string.guid': 'Attendance ID must be a valid UUID',
                'any.required': 'Attendance ID is required',
                'string.base': 'Attendance ID must be a string'
            })
    })  
};

export default {
    createAttendance,
    updateStudentAttendance,
    markMyAttendance,
    bulkUpdateStudentAttendance,
    removeAttendance,
    getAttendanceOfAnyStudentForSpecificCourseInSemester,
    getAttendanceOfEveryStudentForSpecificCourseInSemester,
    getAttendanceOfSelfForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    sendAttendanceReport,
    getAttendanceById,
    getAttendances,
    getActiveAttendanceSheet,
    groupPhotoScan,
    markAllPresentOrAbsent
};
