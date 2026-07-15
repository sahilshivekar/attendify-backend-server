import Joi from 'joi';

const uuid = Joi.string().guid({ version: ['uuidv4', 'uuidv5'] });

const addRoom = {
	body: Joi.object().keys({
		roomNumber: Joi.string().trim().min(1).max(50).required().messages({ 'any.required': 'Room number is required', 'string.min': 'Room number must be at least 1 character', 'string.max': 'Room number cannot exceed 50 characters' }),
		sittingCapacity: Joi.number().integer().min(1).max(1000).required().messages({ 'any.required': 'Sitting capacity is required', 'number.base': 'Sitting capacity must be a number', 'number.min': 'Sitting capacity must be at least 1', 'number.max': 'Sitting capacity cannot exceed 1000' }),
		name: Joi.string().trim().allow('', null).max(100).messages({ 'string.max': 'Name cannot exceed 100 characters' }),
		type: Joi.string().valid('Classroom', 'Lab', 'Office').allow(null).messages({ 'any.only': 'type must be one of classroom, lab, office' })
	})
};

const getRooms = {
	query: Joi.object().keys({
		searchQuery: Joi.string().allow('', null).default('').messages({ 'string.base': 'Search query must be a string' }),
		sortBy: Joi.string().valid('roomNumber', 'sittingCapacity').default('roomNumber').messages({ 'any.only': 'SortBy must be either roomNumber or sittingCapacity' }),
		sortOrder: Joi.string().valid('ASC', 'DESC').default('ASC').messages({ 'any.only': 'SortOrder must be either ASC or DESC' }),
		freeBetweenStartTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).messages({ 'string.pattern.base': 'freeBetweenStartTime must be in HH:mm:ss format', 'any.required': 'Start time is required' }),
		freeBetweenEndTime: Joi.string().pattern(/^\d{2}:\d{2}:\d{2}$/).messages({ 'string.pattern.base': 'freeBetweenEndTime must be in HH:mm:ss format', 'any.required': 'End time is required' }),
		dayOfWeek: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').messages({ 'any.only': 'dayOfWeek must be a valid day of the week' }),
		page: Joi.number().integer().min(1).default(1).messages({ 'number.base': 'Page must be a number', 'number.min': 'Page must be at least 1' }),
		limit: Joi.number().integer().min(1).max(100).default(10).messages({ 'number.base': 'Limit must be a number', 'number.min': 'Limit must be at least 1', 'number.max': 'Limit cannot exceed 100' }),
		getAll: Joi.boolean().default(false).messages({ 'boolean.base': 'getAll must be a boolean' }),
		type: Joi.string().valid('Classroom', 'Lab', 'Office').messages({ 'any.only': 'type must be one of Classroom, Lab, Office' }),
		minCapacity: Joi.number().integer().allow(null).messages({ 'number.base': 'minCapacity must be a number' }),
		maxCapacity: Joi.number().integer().allow(null).messages({ 'number.base': 'maxCapacity must be a number' })
	}).and('freeBetweenStartTime', 'freeBetweenEndTime', 'dayOfWeek')
};

const getRoomById = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) })
};

const getRoomShedule = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) }),
	query: Joi.object()
		.keys({
			startDate: Joi.string()
				.pattern(/^\d{4}-\d{2}-\d{2}$/)
				.required()
				.messages({ 'string.pattern.base': 'startDate must be in YYYY-MM-DD format', 'any.required': 'startDate is required' }),
			endDate: Joi.string()
				.pattern(/^\d{4}-\d{2}-\d{2}$/)
				.required()
				.messages({ 'string.pattern.base': 'endDate must be in YYYY-MM-DD format', 'any.required': 'endDate is required' }),
			startTime: Joi.string()
				.pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/)
				.required()
				.messages({ 'string.pattern.base': 'startTime must be in HH:mm:ss format', 'any.required': 'startTime is required' }),
			endTime: Joi.string()
				.pattern(/^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/)
				.required()
				.messages({ 'string.pattern.base': 'endTime must be in HH:mm:ss format', 'any.required': 'endTime is required' })
		})
		.custom((value, helpers) => {
			// Ensure startDate <= endDate and startTime < endTime
			if (value.startDate > value.endDate) {
				return helpers.error('any.invalid', { message: 'startDate cannot be after endDate' });
			}
			if (value.startTime >= value.endTime) {
				return helpers.error('any.invalid', { message: 'startTime must be before endTime' });
			}
			return value;
		}, 'date/time range validation')
};

const updateRoom = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) }),
	body: Joi.object().keys({
		roomNumber: Joi.string().trim().min(1).max(50).messages({ 'string.min': 'Room number must be at least 1 character', 'string.max': 'Room number cannot exceed 50 characters' }),
		sittingCapacity: Joi.number().integer().min(1).max(1000).messages({ 'number.base': 'Sitting capacity must be a number', 'number.min': 'Sitting capacity must be at least 1', 'number.max': 'Sitting capacity cannot exceed 1000' }),
		name: Joi.string().trim().allow('', null).max(100).messages({ 'string.max': 'Name cannot exceed 100 characters' }),
		type: Joi.string().valid('Classroom', 'Lab', 'Office').allow(null).messages({ 'any.only': 'type must be one of classroom, lab, office' })
	}).min(1).messages({ 'object.min': 'Provide at least one field to update' })
};

const removeRoom = {
	params: Joi.object().keys({ id: uuid.required().messages({ 'any.required': 'Room ID is required', 'string.guid': 'Room ID must be a valid UUID' }) })
};

export default {
	addRoom,
	getRooms,
	getRoomById,
	getRoomShedule,
	updateRoom,
	removeRoom
};


