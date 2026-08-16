import {
    Router
} from 'express';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    getBranches,
    addBranch,
    updateBranch,
    removeBranch,
    getBranchById
} from './branch.controller.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import branchValidation from './branch.validation.js';

const router = Router();

router.route('/').
get(
    validate(branchValidation.getBranches),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getBranches
).
post(
    validate(branchValidation.addBranch),
    verifyJWT([ROLES.ADMIN]),
    addBranch
);

router.route('/:id').
get(
    validate(branchValidation.getBranchById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getBranchById
).
put(
    validate(branchValidation.updateBranch),
    verifyJWT([ROLES.ADMIN]),
    updateBranch
).
delete(
    validate(branchValidation.removeBranch),
    verifyJWT([ROLES.ADMIN]),
    removeBranch
);

export default router;
