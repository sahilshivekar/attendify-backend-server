import {
    Router
} from 'express';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    addAdmin,
    updateAdminDetails,
    removeAdmin,
    getAdmins,
    getAdminDetails
} from './admin.controller.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import adminValidation from './admin.validation.js';

const router = Router();

router.route('/me').
get(verifyJWT([ROLES.ADMIN]), getAdminDetails).
put(validate(adminValidation.updateAdminDetails), verifyJWT([ROLES.ADMIN]), updateAdminDetails).
delete(verifyJWT([ROLES.ADMIN]), removeAdmin);

router.route('/').
get(validate(adminValidation.getAdmins), verifyJWT([ROLES.ADMIN]), getAdmins).
post(validate(adminValidation.addAdmin), verifyJWT([ROLES.ADMIN]), addAdmin);

export default router;
