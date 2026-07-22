import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const getSemesters = {
	query: Joi.object().keys({
		semesterNumber: Joi.number().integer().min(1).max(20).allow(null)
			.messages({ 'number.base': 'Semester number must be a number', 'number.min': 'Semester number must be at least 1', 'number.max': 'Semester number cannot exceed 20' }),
		academicStartYear: Joi.number().integer().allow(null)
			.messages({ 'number.base': 'Academic start year must be a number' }),
		academicEndYear: Joi.number().integer().allow(null)
			.messages({ 'number.base': 'Academic end year must be a number' }),
		branchId: uuid.allow(null).messages({ 'string.guid': 'Branch ID must be a valid UUID' }),
		schemeId: uuid.allow(null).messages({ 'string.guid': 'Scheme ID must be a valid UUID' }),
		page: Joi.number().integer().min(1).default(1)
			.messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10)
			.messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' }),
		isEven: Joi.boolean().default(true).messages({ 'boolean.base': 'isEven must be a boolean' }),
		isOdd: Joi.boolean().default(true).messages({ 'boolean.base': 'isOdd must be a boolean' })
	})
};

const addSemester = {
	body: Joi.object().keys({
		branchId: uuid.required().messages({ 'any.required': 'Branch ID is required', 'string.guid': 'Branch ID must be a valid UUID' }),
		semesterNumber: Joi.number().integer().min(1).max(20).required().messages({ 'any.required': 'Semester number is required' }),
		academicStartYear: Joi.number().integer().min(1900).max(3000).required().messages({ 'any.required': 'Academic start year is required' }),
		academicEndYear: Joi.number().integer().min(1900).max(3000).required().messages({ 'any.required': 'Academic end year is required' }),
		startDate: Joi.date().iso().required().messages({ 'date.format': 'Start date must be a valid ISO date', 'any.required': 'Start date is required' }),
		endDate: Joi.date().iso().required().messages({ 'date.format': 'End date must be a valid ISO date', 'any.required': 'End date is required' }),
		schemeId: uuid.required().messages({ 'any.required': 'Scheme ID is required', 'string.guid': 'Scheme ID must be a valid UUID' })
	})
};

const updateSemester = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		startDate: Joi.date().iso().required().messages({ 'any.required': 'Start date is required' }),
		endDate: Joi.date().iso().required().messages({ 'any.required': 'End date is required' })
	})
};

const removeSemester = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' }) })
};

const getSemesterById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' }) })
};

const getCoursesOfSemester = {
	query: Joi.object().keys({
		semesterId: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' })
	})
};

const bulkCreateSemesters = {
	body: Joi.object().keys({
		semesters: Joi.array().items(
			Joi.object().keys({
				branchId: uuid.required().messages({ 'any.required': 'Branch ID is required', 'string.guid': 'Branch ID must be a valid UUID' }),
				semesterNumber: Joi.number().integer().min(1).max(20).required().messages({ 'any.required': 'Semester number is required' }),
				academicStartYear: Joi.number().integer().min(1900).max(3000).required().messages({ 'any.required': 'Academic start year is required' }),
				academicEndYear: Joi.number().integer().min(1900).max(3000).required().messages({ 'any.required': 'Academic end year is required' }),
				startDate: Joi.date().iso().required().messages({ 'date.format': 'Start date must be a valid ISO date', 'any.required': 'Start date is required' }),
				endDate: Joi.date().iso().required().messages({ 'date.format': 'End date must be a valid ISO date', 'any.required': 'End date is required' }),
				schemeId: uuid.required().messages({ 'any.required': 'Scheme ID is required', 'string.guid': 'Scheme ID must be a valid UUID' })
			})
		).min(1).max(50).required()
		.messages({
			'any.required': 'Semesters array is required',
			'array.min': 'At least 1 semester is required',
			'array.max': 'Cannot create more than 50 semesters at once'
		})
	})
};

const bulkDeleteSemesters = {
	body: Joi.object().keys({
		semesterIds: Joi.array().items(
			uuid.required().messages({ 'string.guid': 'Each semester ID must be a valid UUID' })
		).min(1).max(50).required()
		.messages({
			'any.required': 'Semester IDs array is required',
			'array.min': 'At least 1 semester ID is required',
			'array.max': 'Cannot delete more than 50 semesters at once'
		})
	})
};

export default {
	getSemesters,
	addSemester,
	updateSemester,
	removeSemester,
	getSemesterById,
	getCoursesOfSemester,
	bulkCreateSemesters,
	bulkDeleteSemesters
};


