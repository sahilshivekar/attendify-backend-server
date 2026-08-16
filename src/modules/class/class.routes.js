import express from 'express';
import {
    addClass,
    getClasses,
    getStudentsUpcomingClasses,
    getTeachersUpcomingClasses,
    getClassById,
    editActiveDatesOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass,
    bulkCreateClasses,
    bulkDeleteClasses,
    bulkCreateClassesFromCSV
} from './class.controller.js';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import classValidation from './class.validation.js';
import {
    upload
} from '../../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/').
get(
    validate(classValidation.getClasses),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getClasses
).
post(
    validate(classValidation.addClass),
    verifyJWT([ROLES.ADMIN]),
    addClass
);

router.route('/cancelled').
get(
    validate(classValidation.getCancelledClasses),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getCancelledClasses
).
post(
    validate(classValidation.cancelClass),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    cancelClass
);

router.route('/students/upcoming').
get(
    validate(classValidation.getStudentsUpcomingClasses),
    verifyJWT([ROLES.STUDENT]),
    getStudentsUpcomingClasses
);

router.route('/teachers/upcoming').
get(
    validate(classValidation.getTeachersUpcomingClasses),
    verifyJWT([ROLES.TEACHER]),
    getTeachersUpcomingClasses
);

router.route('/:id').
get(
    validate(classValidation.getClassById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getClassById
).
put(
    validate(classValidation.editActiveDatesOfClass),
    verifyJWT([ROLES.ADMIN]),
    editActiveDatesOfClass
).
delete(
    validate(classValidation.removeClass),
    verifyJWT([ROLES.ADMIN]),
    removeClass
);

router.route('/extra').
post(
    validate(classValidation.addExtraClass),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    addExtraClass
);

router.route('/bulk/create').
post(validate(classValidation.bulkCreateClasses), verifyJWT([ROLES.ADMIN]), bulkCreateClasses);

router.route('/bulk/delete').
delete(validate(classValidation.bulkDeleteClasses), verifyJWT([ROLES.ADMIN]), bulkDeleteClasses);

router.route('/bulk/csv-upload').
post(
    upload.single('csvFile'),
    validate(classValidation.bulkCreateClassesFromCSV),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateClassesFromCSV
);

export default router;
