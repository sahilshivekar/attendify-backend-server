import {
    Op
} from 'sequelize';
import Student from '../db/models/student.model.js';
import {
    asyncHandler
} from '../utils/asyncHandler.js';
import {
    ApiError
} from '../utils/ApiError.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';
import Dropout from '../db/models/dropout.model.js';
import Semester from '../db/models/semester.model.js';
import StudentSemester from '../db/models/studentSemester.model.js';
import sequelize from '../config/db.connection.js';
import httpStatus from 'http-status';

const addStudentToDropout = asyncHandler(async (req, res) => {
    const {
        studentId,
        academicStartYear,
        academicEndYear
    } = req.body;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (academicStartYear < student.admissionYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Academic start year cannot be before student's admission year");
    }

    const isAlreayInDropout = await Dropout.findOne({
        where: {
            studentId,
            academicStartYear,
            academicEndYear
        }
    });

    if (isAlreayInDropout) {
        throw new ApiError(httpStatus.CONFLICT, "Student is already in dropout");
    }

    const dropout = await sequelize.transaction(async (t) => {

        const semesters = await Semester.findAll({
            where: {
                academicStartYear,
                academicEndYear
            },
            attributes: ['id'],
            transaction: t
        });

        const semesterIds = semesters.map((sem) => sem.id);

        if (semesterIds.length > 0) {
            await StudentSemester.destroy({
                where: {
                    studentId,
                    semesterId: {
                        [Op.in]: semesterIds
                    }
                },
                transaction: t
            });
        }

        const dropoutRecord = await Dropout.create({
            studentId,
            academicStartYear,
            academicEndYear
        }, {
            transaction: t
        });

        return dropoutRecord;
    });

    res.
    status(httpStatus.CREATED).
    json(
        new ApiResponse(
            httpStatus.CREATED,
            "Student added to dropout successfully",
            dropout
        )
    );
});

const removeStudentFromDropout = asyncHandler(async (req, res) => {
    const {
        studentId,
        academicStartYear,
        academicEndYear
    } = req.query;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (academicStartYear < student.admissionYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Academic start year cannot be before student's admission year");
    }

    const isAlreayInDropout = await Dropout.findOne({
        where: {
            studentId,
            academicStartYear,
            academicEndYear
        }
    });

    if (!isAlreayInDropout) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student is not in dropout");
    }

    await isAlreayInDropout.destroy();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student removed from dropout successfully",
            null
        )
    );
});

const getDropoutById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const dropout = await Dropout.findOne({
        where: {
            id: id
        },
        include: {
            model: Student,
            required: true,
            duplicating: false
        }
    });

    if (!dropout) {
        throw new ApiError(httpStatus.NOT_FOUND, "Dropout details for given input not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Dropout fetched successfully",
            dropout
        )
    );
});

const getDropoutDetailsOfStudent = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.query;

    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const dropouts = await Dropout.findAll({
        where: {
            studentId: studentId
        }
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Dropout fetched successfully",
            dropouts
        )
    );
});

export {
    addStudentToDropout,
    removeStudentFromDropout,
    getDropoutById,
    getDropoutDetailsOfStudent
};
