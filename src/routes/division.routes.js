import {
    Router
} from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById,
    getCoursesOfDivision
} from '../controllers/division.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import divisionValidation from '../validators/division.validation.js';

const router = Router();

router.route('/').
get(
    validate(divisionValidation.getDivisions),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getDivisions
).
post(
    validate(divisionValidation.addDivision),
    verifyJWT([ROLES.ADMIN]),
    addDivision
);

router.route('/courses').
get(
    validate(divisionValidation.getCoursesOfDivision),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getCoursesOfDivision
);

router.route('/:id').
get(
    validate(divisionValidation.getDivisionById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getDivisionById
).
put(
    validate(divisionValidation.updateDivision),
    verifyJWT([ROLES.ADMIN]),
    updateDivision
).
delete(
    validate(divisionValidation.removeDivision),
    verifyJWT([ROLES.ADMIN]),
    removeDivision
);

export default router;
