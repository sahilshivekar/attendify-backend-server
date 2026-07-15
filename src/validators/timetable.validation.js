import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const getTimetables = {
	query: Joi.object().keys({
		semesterNumber: Joi.number().integer().min(1).max(20).allow(null).messages({ 'number.base': 'Semester number must be a number' }),
		academicStartYearOfSemester: Joi.number().integer().allow(null).messages({ 'number.base': 'Academic start year must be a number' }),
		academicEndYearOfSemester: Joi.number().integer().allow(null).messages({ 'number.base': 'Academic end year must be a number' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' })
	})
};

const getTimetableById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Timetable ID is required', 'string.guid': 'Timetable ID must be a valid UUID' }) })
};

const getMyTimetables = {
	query: Joi.object().max(0)
};

const addTimetable = {
	body: Joi.object().keys({
		divisionId: uuid.required().messages({ 'any.required': 'Division ID is required', 'string.guid': 'Division ID must be a valid UUID' }),
		timetableVersion: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Timetable version must be a number', 'number.min': 'Timetable version must be at least 1' })
	})
};

const updateTimetable = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Timetable ID is required', 'string.guid': 'Timetable ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		timetableVersion: Joi.number().integer().min(1).required().messages({ 'any.required': 'Timetable version is required', 'number.base': 'Timetable version must be a number' })
	})
};

const removeTimetable = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Timetable ID is required', 'string.guid': 'Timetable ID must be a valid UUID' }) })
};

export default {
	getTimetables,
	getTimetableById,
	getMyTimetables,
	addTimetable,
	updateTimetable,
	removeTimetable
};


