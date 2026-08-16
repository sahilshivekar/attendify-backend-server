import express from 'express';
import {
    getTeacher,
    addTeacher,
    updateTeacherDetails,
    updateTeacherPassword,
    updateTeacherImage,
    removeTeacher,
    removeImage,
    getTeacherById,
    getTeachingCourses,
    addTeachingCourse,
    removeTeachingCourse,
    bulkCreateTeachers,
    bulkDeleteTeachers,
    bulkCreateTeachersFromCSV
} from './teacher.controller.js';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    ROLES
} from '../../config/roles.js';
import {
    upload
} from '../../middlewares/multer.middleware.js';
import validate from '../../middlewares/validate.js';
import teacherValidation from './teacher.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(teacherValidation.getTeacher),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getTeacher
).
post(
    upload.single('teacherImageFile'),
    validate(teacherValidation.addTeacher),
    verifyJWT([ROLES.ADMIN]),
    addTeacher
).
put(
    validate(teacherValidation.updateTeacherDetails),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    updateTeacherDetails
);

router.route('/image').
put(
    upload.single('teacherImageFile'),
    validate(teacherValidation.updateTeacherImage),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    updateTeacherImage
).
delete(
    validate(teacherValidation.removeImage),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    removeImage
);

router.route('/password').
put(validate(teacherValidation.updateTeacherPassword), verifyJWT([ROLES.ADMIN]), updateTeacherPassword);

router.route('/courses').
get(
    validate(teacherValidation.getTeachingCourses),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getTeachingCourses
).
post(
    validate(teacherValidation.addTeachingCourse),
    verifyJWT([ROLES.ADMIN]),
    addTeachingCourse
);

router.route('/courses/:teacherTeachesCourseId').
delete(
    validate(teacherValidation.removeTeachingCourse),
    verifyJWT([ROLES.ADMIN]),
    removeTeachingCourse
);

router.route('/bulk/create').
post(validate(teacherValidation.bulkCreateTeachers), verifyJWT([ROLES.ADMIN]), bulkCreateTeachers);

router.route('/bulk/delete').
delete(validate(teacherValidation.bulkDeleteTeachers), verifyJWT([ROLES.ADMIN]), bulkDeleteTeachers);

router.route('/bulk/csv').
post(
    upload.single('csvFile'),
    validate(teacherValidation.bulkCreateTeachersFromCSV),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateTeachersFromCSV
);

router.route('/:id').
get(
    validate(teacherValidation.getTeacherById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getTeacherById
).
delete(
    validate(teacherValidation.removeTeacher),
    verifyJWT([ROLES.ADMIN]),
    removeTeacher
);

export default router;
