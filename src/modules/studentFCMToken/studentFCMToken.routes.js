import {
    Router
} from 'express';
import {
    upsertStudentFCMToken,
    removeStudentFCMTokens
} from './studentFCMToken.controller.js';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import studentFCMValidation from './studentFCMToken.validation.js';

const router = Router();

router.route('/').
post(validate(studentFCMValidation.upsertStudentFCMToken), verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), upsertStudentFCMToken).
delete(validate(studentFCMValidation.removeStudentFCMTokens), verifyJWT([ROLES.ADMIN, ROLES.STUDENT]), removeStudentFCMTokens);

export default router;
