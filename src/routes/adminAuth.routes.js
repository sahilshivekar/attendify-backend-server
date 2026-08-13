import {
    Router
} from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    login,
    updateAdminPassword,
    verifyPassword,
    sendVerificationCodeToEmail,
    verifyCode,
    refreshTokens,
    logout
} from '../controllers/adminAuth.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import adminAuthValidation from '../validators/adminAuth.validation.js';

const router = Router();

router.route('/login').post(validate(adminAuthValidation.login), login);
router.route('/forgot-password').post(validate(adminAuthValidation.sendVerificationCodeToEmail), sendVerificationCodeToEmail);
router.route('/verify-code').post(validate(adminAuthValidation.verifyCode), verifyCode);
router.route('/access-token').post(validate(adminAuthValidation.refreshTokens), refreshTokens);

router.route('/verify-password').post(validate(adminAuthValidation.verifyPassword), verifyJWT([ROLES.ADMIN]), verifyPassword);
router.route('/update-password').put(validate(adminAuthValidation.updateAdminPassword), verifyJWT([ROLES.ADMIN]), updateAdminPassword);
router.route('/logout').post(verifyJWT([ROLES.ADMIN]), logout);
router.route('/email-verification').get(validate(adminAuthValidation.sendVerificationCodeToEmail), verifyJWT([ROLES.ADMIN]), sendVerificationCodeToEmail);

export default router;
