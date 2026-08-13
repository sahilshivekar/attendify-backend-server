import express from 'express';
import {
    getTimetables,
    getTimetableById,
    getMyTimetables,
    addTimetable,
    updateTimetable,
    removeTimetable
} from '../controllers/timetable.controller.js';
import {
    verifyJWT
} from '../middlewares/auth.middleware.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import timetableValidation from '../validators/timetable.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(timetableValidation.getTimetables),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getTimetables
).
post(
    validate(timetableValidation.addTimetable),
    verifyJWT([ROLES.ADMIN]),
    addTimetable
);

router.route('/me').
get(
    validate(timetableValidation.getMyTimetables),
    verifyJWT([ROLES.STUDENT]),
    getMyTimetables
);

router.route('/:id').
get(
    validate(timetableValidation.getTimetableById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getTimetableById
).
put(
    validate(timetableValidation.updateTimetable),
    verifyJWT([ROLES.ADMIN]),
    updateTimetable
).
delete(
    validate(timetableValidation.removeTimetable),
    verifyJWT([ROLES.ADMIN]),
    removeTimetable
);

export default router;
