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
} from '../controllers/attendance.controller.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { ROLES } from '../config/roles.js';
import validate from '../middlewares/validate.js';
import attendanceValidation from '../validators/attendance.validation.js';
import { upload } from '../middlewares/multer.middleware.js';

const router = express.Router();

// Basic CRUD operations for attendance sheets
router.route('/')
    .get(validate(attendanceValidation.getAttendances), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getAttendances)
    .post(validate(attendanceValidation.createAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), createAttendance)
    .delete(validate(attendanceValidation.removeAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), removeAttendance);

// Student-specific attendance operations
router.route('/students')
    .put(validate(attendanceValidation.updateStudentAttendance), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), updateStudentAttendance);

// Individual student attendance queries
router.route('/student')
    .get(validate(attendanceValidation.getAttendanceOfAnyStudentForSpecificCourseInSemester), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfStudentForSpecificCourseInSemester);

router.route('/students/bulk')
    .get(validate(attendanceValidation.getAttendanceOfEveryStudentForSpecificCourseInSemester), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfEveryStudentForSpecificCourseInSemester);

router.route('/me')
    .get(validate(attendanceValidation.getAttendanceOfSelfForSpecificCourseInSemester), verifyJWT([ROLES.STUDENT]), getAttendanceOfStudentForSpecificCourseInSemester);

router.route('/me/mark')
    .post(
        validate(attendanceValidation.markMyAttendance),
        verifyJWT([ROLES.STUDENT]),
        markMyAttendance
    );

// Bulk attendance queries (all students)
router.route('/all')
    .get(validate(attendanceValidation.getAttendanceOfAllForSemesterDivisionBatchCourse), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceOfAllForSemesterDivisionBatchCourse);

// Active attendance sheet operations
router.route('/active')
    .get(validate(attendanceValidation.getActiveAttendanceSheet), verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]), getActiveAttendanceSheet);

router.route('/group-photo-scan')
    .post(
        upload.array('studentsGroupPhotos'),
        validate(attendanceValidation.groupPhotoScan),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        groupPhotoScan
    );

// Reporting functionality
router.route('/report')
    .post(validate(attendanceValidation.sendAttendanceReport), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), sendAttendanceReport);

// Bulk operations
router.route('/bulk/update')
    .put(
        validate(attendanceValidation.bulkUpdateStudentAttendance),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        bulkUpdateStudentAttendance
    );

router.route('/bulk/mark-all-present')
    .put(
        validate(attendanceValidation.markAllPresentOrAbsent),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        markAllPresent
    );

router.route('/bulk/mark-all-absent')
    .put(
        validate(attendanceValidation.markAllPresentOrAbsent),
        verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
        markAllAbsent
    );

// Get single attendance by ID (must be LAST to avoid catching named routes)
router.route('/:attendanceId')
    .get(validate(attendanceValidation.getAttendanceById), verifyJWT([ROLES.ADMIN, ROLES.TEACHER]), getAttendanceById);

export default router;
