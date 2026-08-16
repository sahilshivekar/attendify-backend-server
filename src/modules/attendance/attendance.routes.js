import express from 'express';
import {
    removeAttendance,
    updateStudentAttendance,
    markMyAttendance,
    bulkUpdateStudentAttendance,
    createAttendance,
    getAttendanceOfStudentForSpecificCourseInSemester,
    getAttendanceOfEveryStudentForSpecificCourseInSemester,
    getAttendanceOfAllForSemesterDivisionBatchCourse,
    sendAttendanceReport,
    getAttendanceById,
    getAttendances,
    getActiveAttendanceSheet,
    groupPhotoScan,
    markAllPresent,
    markAllAbsent
} from './attendance.controller.js';
import {
    verifyJWT
} from '../../middlewares/auth.middleware.js';
import {
    ROLES
} from '../../config/roles.js';
import validate from '../../middlewares/validate.js';
import attendanceValidation from './attendance.validation.js';
import {
    upload
} from '../../middlewares/multer.middleware.js';

const router = express.Router();

router.route('/').
get(validate(attendanceValidation.getAttendances), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getAttendances).
post(validate(attendanceValidation.createAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), createAttendance).
delete(validate(attendanceValidation.removeAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), removeAttendance);

router.route('/students').
put(validate(attendanceValidation.updateStudentAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), updateStudentAttendance);

router.route('/student').
get(validate(attendanceValidation.getAttendanceOfAnyStudentForSpecificCourseInSemester), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfStudentForSpecificCourseInSemester);

router.route('/students/bulk').
get(validate(attendanceValidation.getAttendanceOfEveryStudentForSpecificCourseInSemester), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfEveryStudentForSpecificCourseInSemester);

router.route('/me').
get(validate(attendanceValidation.getAttendanceOfSelfForSpecificCourseInSemester), verifyJWT([ROLES.STUDENT]), getAttendanceOfStudentForSpecificCourseInSemester);

router.route('/me/mark').
post(
    validate(attendanceValidation.markMyAttendance),
    verifyJWT([ROLES.STUDENT]),
    markMyAttendance
);

router.route('/all').
get(validate(attendanceValidation.getAttendanceOfAllForSemesterDivisionBatchCourse), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfAllForSemesterDivisionBatchCourse);

router.route('/active').
get(validate(attendanceValidation.getActiveAttendanceSheet), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getActiveAttendanceSheet);

router.route('/group-photo-scan').
post(
    upload.array('studentsGroupPhotos'),
    validate(attendanceValidation.groupPhotoScan),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    groupPhotoScan
);

router.route('/report').
post(validate(attendanceValidation.sendAttendanceReport), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), sendAttendanceReport);

router.route('/bulk/update').
put(
    validate(attendanceValidation.bulkUpdateStudentAttendance),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    bulkUpdateStudentAttendance
);

router.route('/bulk/mark-all-present').
put(
    validate(attendanceValidation.markAllPresentOrAbsent),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    markAllPresent
);

router.route('/bulk/mark-all-absent').
put(
    validate(attendanceValidation.markAllPresentOrAbsent),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    markAllAbsent
);

router.route('/:attendanceId').
get(validate(attendanceValidation.getAttendanceById), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceById);

export default router;
