import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const getDivisions = {
	query: Joi.object().keys({
		semesterNumber: Joi.number().integer().min(1).max(20).allow(null)
			.messages({ 'number.base': 'Semester number must be a number', 'number.min': 'Semester number must be at least 1', 'number.max': 'Semester number cannot exceed 20' }),
		branchId: uuid.allow(null).messages({ 'string.guid': 'Branch ID must be a valid UUID' }),
		semesterId: uuid.allow(null).messages({ 'string.guid': 'Semester ID must be a valid UUID' }),
		academicStartYear: Joi.number().integer().allow(null)
			.messages({ 'number.base': 'Academic start year must be a number' }),
		academicEndYear: Joi.number().integer().allow(null)
			.messages({ 'number.base': 'Academic end year must be a number' }),
		searchQuery: Joi.string().allow('', null).default('')
			.messages({ 'string.base': 'Search query must be a string' }),
		page: Joi.number().integer().min(1).default(1)
			.messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10)
			.messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' })
	})
};

const addDivision = {
	body: Joi.object().keys({
		divisionCode: Joi.string().trim().min(1).max(10).required()
			.messages({ 'any.required': 'Division code is required', 'string.min': 'Division code must be at least 1 character', 'string.max': 'Division code cannot exceed 10 characters' }),
		semesterId: uuid.required().messages({ 'any.required': 'Semester ID is required', 'string.guid': 'Semester ID must be a valid UUID' }),
		optionalCourseIds: Joi.array().items(uuid.messages({ 'string.guid': 'Each optional course ID must be a valid UUID' }))
			.messages({ 'array.base': 'Optional course IDs must be an array' })
	})
};

const updateDivision = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		divisionCode: Joi.string().trim().min(1).max(10)
			.messages({ 'string.min': 'Division code must be at least 1 character', 'string.max': 'Division code cannot exceed 10 characters' }),
		optionalCourseIds: Joi.array().items(uuid.messages({ 'string.guid': 'Each optional course ID must be a valid UUID' }))
			.messages({ 'array.base': 'Optional course IDs must be an array' })
	})
};

const removeDivision = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' }) })
};

const getDivisionById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' }) })
};

const getCoursesOfDivision = {
	query: Joi.object().keys({
		divisionId: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' })
	})
};

export default {
	getDivisions,
	addDivision,
	updateDivision,
	removeDivision,
	getDivisionById,
	getCoursesOfDivision
};


