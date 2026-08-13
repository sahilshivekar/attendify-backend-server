import express from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    getBatches,
    addBatch,
    updateBatch,
    removeBatch,
    getBatchById
} from '../controllers/batch.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import batchValidation from '../validators/batch.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(batchValidation.getBatches),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getBatches
).
post(
    validate(batchValidation.addBatch),
    verifyJWT([ROLES.ADMIN]),
    addBatch
);

router.route('/:id').
get(
    validate(batchValidation.getBatchById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getBatchById
).
put(
    validate(batchValidation.updateBatch),
    verifyJWT([ROLES.ADMIN]),
    updateBatch
).
delete(
    validate(batchValidation.removeBatch),
    verifyJWT([ROLES.ADMIN]),
    removeBatch
);

export default router;
