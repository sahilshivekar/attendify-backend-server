import {
    Router
} from 'express';
import {
    updateTeacherPassword,
    loginTeacher,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout
} from './teacherAuth.controller.js';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import teacherAuthValidation from './teacherAuth.validation.js';

const router = Router();

router.route('/login').post(validate(teacherAuthValidation.loginTeacher), loginTeacher);
router.route('/send-verification-code').post(validate(teacherAuthValidation.sendVerificationCodeToEmail), sendVerificationCodeToEmail);
router.route('/access-token').get(validate(teacherAuthValidation.refreshTokens), refreshTokens);

router.route('/update-password').put(validate(teacherAuthValidation.updateTeacherPassword), verifyJWT([ROLES.TEACHER]), updateTeacherPassword);
router.route('/verify-code').post(validate(teacherAuthValidation.verifyCode), verifyJWT([ROLES.TEACHER]), verifyCode);
router.route('/logout').post(verifyJWT([ROLES.TEACHER]), logout);

export default router;
