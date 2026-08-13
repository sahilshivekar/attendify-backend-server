import express from 'express';
import {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent,
    getStudentDetailsById,
    addStudentToSemester,
    removeStudentFromSemester,
    addStudentToDivision,
    changeStudentDivision,
    revertAddStudentToDivision,
    revertChangeStudentDivision,
    addStudentToBatch,
    changeStudentBatch,
    revertAddStudentToBatch,
    revertChangeStudentBatch,
    getStudentSemestersById,
    getStudentDivisionsById,
    getStudentBatchesById,
    bulkCreateStudents,
    bulkDeleteStudents,
    bulkAddStudentsToSemester,
    bulkAddStudentsToDivision,
    bulkAddStudentsToBatch,
    bulkCreateStudentsFromCSV,
    enrollStudentFace,
    submitStudentBiometrics,
    getStudentBiometrics,
    verifyStudentBiometrics,
    rejectStudentBiometrics
} from '../controllers/student.controller.js';
import {
    verifyJWT
} from '../middlewares/auth.middleware.js';
import {
    ROLES
} from '../config/roles.js';
import {
    upload
} from '../middlewares/multer.middleware.js';
import validate from '../middlewares/validate.js';
import studentValidation from '../validators/student.validation.js';

const router = express.Router();

router.route('/').
get(
    validate(studentValidation.getStudents),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getStudents
).
post(
    upload.single('studentImageFile'),
    validate(studentValidation.addStudent),
    verifyJWT([ROLES.ADMIN]),
    addStudent
).
put(
    validate(studentValidation.updateStudentDetails),
    verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
    updateStudentDetails
);

router.route('/password').
put(validate(studentValidation.updateStudentPassword), verifyJWT([ROLES.ADMIN]), updateStudentPassword);

router.route('/image').
put(
    upload.single('studentImageFile'),
    validate(studentValidation.updateStudentImage),
    verifyJWT([ROLES.ADMIN]),
    updateStudentImage
).
delete(
    validate(studentValidation.removeStudentImage),
    verifyJWT([ROLES.ADMIN, ROLES.STUDENT]),
    removeStudentImage
);

router.route('/biometrics/submit').
post(
    upload.array('biometricImages', 10),
    validate(studentValidation.submitStudentBiometrics),
    verifyJWT([ROLES.STUDENT]),
    submitStudentBiometrics
);

router.route('/:studentId/biometrics').
get(
    validate(studentValidation.getStudentBiometrics),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    getStudentBiometrics
);

router.route('/:studentId/biometrics/verify').
patch(
    validate(studentValidation.verifyStudentBiometrics),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    verifyStudentBiometrics
);

router.route('/:studentId/biometrics/reject').
patch(
    validate(studentValidation.rejectStudentBiometrics),
    verifyJWT([ROLES.ADMIN]),
    rejectStudentBiometrics
);

router.route('/face/enroll').
post(
    upload.array('faceImages'),
    validate(studentValidation.enrollStudentFace),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER]),
    enrollStudentFace
);

router.route('/:id/semesters').
get(
    validate(studentValidation.getStudentSemestersById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getStudentSemestersById
);

router.route('/:id/divisions').
get(
    validate(studentValidation.getStudentDivisionsById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getStudentDivisionsById
);

router.route('/:id/batches').
get(
    validate(studentValidation.getStudentBatchesById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getStudentBatchesById
);

router.route('/semester').
post(validate(studentValidation.addStudentToSemester), verifyJWT([ROLES.ADMIN]), addStudentToSemester).
delete(validate(studentValidation.removeStudentFromSemester), verifyJWT([ROLES.ADMIN]), removeStudentFromSemester);

router.route('/division').
post(validate(studentValidation.addStudentToDivision), verifyJWT([ROLES.ADMIN]), addStudentToDivision).
put(validate(studentValidation.changeStudentDivision), verifyJWT([ROLES.ADMIN]), changeStudentDivision);

router.route('/division/revert-add').
delete(validate(studentValidation.revertAddStudentToDivision), verifyJWT([ROLES.ADMIN]), revertAddStudentToDivision);

router.route('/division/revert-change').
delete(validate(studentValidation.revertChangeStudentDivision), verifyJWT([ROLES.ADMIN]), revertChangeStudentDivision);

router.route('/batch').
post(validate(studentValidation.addStudentToBatch), verifyJWT([ROLES.ADMIN]), addStudentToBatch).
put(validate(studentValidation.changeStudentBatch), verifyJWT([ROLES.ADMIN]), changeStudentBatch);

router.route('/batch/revert-add').
delete(validate(studentValidation.revertAddStudentToBatch), verifyJWT([ROLES.ADMIN]), revertAddStudentToBatch);

router.route('/batch/revert-change').
delete(validate(studentValidation.revertChangeStudentBatch), verifyJWT([ROLES.ADMIN]), revertChangeStudentBatch);

router.route('/:id').
get(
    validate(studentValidation.getStudentDetailsById),
    verifyJWT([ROLES.ADMIN, ROLES.TEACHER, ROLES.STUDENT]),
    getStudentDetailsById
).
delete(
    validate(studentValidation.removeStudent),
    verifyJWT([ROLES.ADMIN]),
    removeStudent
);

router.route('/bulk/create').
post(validate(studentValidation.bulkCreateStudents), verifyJWT([ROLES.ADMIN]), bulkCreateStudents);

router.route('/bulk/delete').
delete(validate(studentValidation.bulkDeleteStudents), verifyJWT([ROLES.ADMIN]), bulkDeleteStudents);

router.route('/bulk/semester').
post(validate(studentValidation.bulkAddStudentsToSemester), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToSemester);

router.route('/bulk/division').
post(validate(studentValidation.bulkAddStudentsToDivision), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToDivision);

router.route('/bulk/batch').
post(validate(studentValidation.bulkAddStudentsToBatch), verifyJWT([ROLES.ADMIN]), bulkAddStudentsToBatch);

router.route('/bulk/csv').
post(
    upload.single('csvFile'),
    validate(studentValidation.bulkCreateStudentsFromCSV),
    verifyJWT([ROLES.ADMIN]),
    bulkCreateStudentsFromCSV
);

export default router;
