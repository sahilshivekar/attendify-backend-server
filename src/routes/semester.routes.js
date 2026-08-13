import express from 'express';
import {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById,
    bulkCreateSemesters,
    bulkDeleteSemesters
} from '../controllers/semester.controller.js';
import {
    verifyJWT
} from '../middlewares/auth.middleware.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import semesterValidation from '../validators/semester.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(semesterValidation.getSemesters),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getSemesters
).
post(
    validate(semesterValidation.addSemester),
    verifyJWT([ROLES.ADMIN]),
    addSemester
);

router.route('/courses').
get(
    validate(semesterValidation.getCoursesOfSemester),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getCoursesOfSemester
);

router.route('/:id').
get(
    validate(semesterValidation.getSemesterById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getSemesterById
).
put(
    validate(semesterValidation.updateSemester),
    verifyJWT([ROLES.ADMIN]),
    updateSemester
).
delete(
    validate(semesterValidation.removeSemester),
    verifyJWT([ROLES.ADMIN]),
    removeSemester
);

router.route('/bulk/create').
post(
    validate(semesterValidation.bulkCreateSemesters),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateSemesters
);

router.route('/bulk/delete').
delete(
    validate(semesterValidation.bulkDeleteSemesters),
    verifyJWT([ROLES.ADMIN]),
    bulkDeleteSemesters
);

export default router;
