import {
    Router
} from 'express';
import {
    verifyJWT
} from "../middlewares/auth.middleware.js";
import {
    getCourses,
    addCourse,
    updateCourse,
    removeCourse,
    addCourseToBranchWithSemesterNumber,
    removeCourseFromBranchWithSemesterNumber,
    getCourseById,
    bulkCreateCourses,
    bulkDeleteCourses,
    bulkCreateCoursesFromCSV
} from '../controllers/course.controller.js';
import {
    ROLES
} from '../config/roles.js';
import validate from '../middlewares/validate.js';
import courseValidation from '../validators/course.validation.js';
import {
    upload
} from '../middlewares/multer.middleware.js';

const router = Router();

router.route('/').
get(
    validate(courseValidation.getCourses),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getCourses
).
post(
    validate(courseValidation.addCourse),
    verifyJWT([ROLES.ADMIN]),
    addCourse
);

router.route('/:id').
get(
    validate(courseValidation.getCourseById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getCourseById
).
put(
    validate(courseValidation.updateCourse),
    verifyJWT([ROLES.ADMIN]),
    updateCourse
).
delete(
    validate(courseValidation.removeCourse),
    verifyJWT([ROLES.ADMIN]),
    removeCourse
);

router.route('/branch').
post(
    validate(courseValidation.addCourseToBranchWithSemesterNumber),
    verifyJWT([ROLES.ADMIN]),
    addCourseToBranchWithSemesterNumber
);

router.route('/branch/:branchCourseSemesterId').
delete(
    validate(courseValidation.removeCourseFromBranchWithSemesterNumber),
    verifyJWT([ROLES.ADMIN]),
    removeCourseFromBranchWithSemesterNumber
);

router.route('/bulk/create').
post(
    validate(courseValidation.bulkCreateCourses),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateCourses
);

router.route('/bulk/delete').
delete(
    validate(courseValidation.bulkDeleteCourses),
    verifyJWT([ROLES.ADMIN]),
    bulkDeleteCourses
);

router.route('/bulk/csv').
post(
    upload.single('csvFile'),
    validate(courseValidation.bulkCreateCoursesFromCSV),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateCoursesFromCSV
);

export default router;
