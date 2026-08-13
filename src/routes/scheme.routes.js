import {
    Router
} from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    getSchemes,
    addScheme,
    updateScheme,
    removeScheme,
    getSchemeById
} from '../controllers/scheme.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import schemeValidation from '../validators/scheme.validation.js';

const router = Router();

router.route('/').
get(
    validate(schemeValidation.getSchemes),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getSchemes
).
post(
    validate(schemeValidation.addScheme),
    verifyJWT([ROLES.ADMIN]),
    addScheme
);

router.route('/:id').
get(
    validate(schemeValidation.getSchemeById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getSchemeById
).
put(
    validate(schemeValidation.updateScheme),
    verifyJWT([ROLES.ADMIN]),
    updateScheme
).
delete(
    validate(schemeValidation.removeScheme),
    verifyJWT([ROLES.ADMIN]),
    removeScheme
);

export default router;
