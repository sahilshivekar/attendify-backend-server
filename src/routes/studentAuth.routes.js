import {
    Router
} from 'express';
import {
    updateStudentPassword,
    loginStudent,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout
} from '../controllers/studentAuth.controller.js';
import {
    verifyJWT
} from '../middlewares/auth.middleware.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import studentAuthValidation from '../validators/studentAuth.validation.js';

const router = Router();

router.route('/login').post(validate(studentAuthValidation.loginStudent), loginStudent);
router.route('/send-verification-code').post(validate(studentAuthValidation.sendVerificationCodeToEmail), sendVerificationCodeToEmail);
router.route('/access-token').post(validate(studentAuthValidation.refreshTokens), refreshTokens);

router.route('/update-password').put(validate(studentAuthValidation.updateStudentPassword), verifyJWT([ROLES.STUDENT]), updateStudentPassword);
router.route('/verify-code').post(validate(studentAuthValidation.verifyCode), verifyJWT([ROLES.STUDENT]), verifyCode);
router.route('/logout').post(verifyJWT([ROLES.STUDENT]), logout);

export default router;
