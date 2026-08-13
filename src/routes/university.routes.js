import {
    Router
} from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    getUniversities,
    addUniversity,
    updateUniversity,
    removeUniversity,
    getUniversityById
} from '../controllers/university.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import universityValidation from '../validators/university.validation.js';

const router = Router();

router.route('/').
get(
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getUniversities
).
post(
    validate(universityValidation.addUniversity),
    verifyJWT([ROLES.ADMIN]),
    addUniversity
);

router.route('/:id').
get(
    validate(universityValidation.getUniversityById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getUniversityById
).
put(
    validate(universityValidation.updateUniversity),
    verifyJWT([ROLES.ADMIN]),
    updateUniversity
).
delete(
    validate(universityValidation.removeUniversity),
    verifyJWT([ROLES.ADMIN]),
    removeUniversity
);

export default router;
