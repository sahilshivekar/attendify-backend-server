import {
    Op,
    fn,
    col,
    where,
    literal
} from 'sequelize';
import {
    asyncHandler
} from '../../utils/asyncHandler.js';
import fs from 'fs';
import {
    randomUUID
} from 'crypto';
import csvParser from 'csv-parser';
import Student from '../../db/models/student.model.js';
import {
    ApiResponse
} from '../../utils/ApiResponse.js';
import {
    ApiError
} from '../../utils/ApiError.js';
import {
    uploadOnCloudinary,
    deleteFromCloudinary
} from '../../utils/cloudinary.js';
import {
    isValidPhoneNumber
} from 'libphonenumber-js';
import Scheme from '../../db/models/scheme.model.js';
import moment from "moment";
import Semester from '../../db/models/semester.model.js';
import StudentSemester from '../../db/models/studentSemester.model.js';
import Branch from '../../db/models/branch.model.js';
import StudentBatch from '../../db/models/studentBatch.model.js';
import StudentDivision from '../../db/models/studentDivision.model.js';
import Division from '../../db/models/division.model.js';
import sequelize from '../../config/db.connection.js';
import Batch from '../../db/models/batch.model.js';
import {
    get
} from 'http';
import {
    getDateStringFromObj
} from '../../utils/date.js';
import Dropout from '../../db/models/dropout.model.js';
import httpStatus from 'http-status';
import studentValidation from './student.validation.js';
import {
    generateSingleDescriptor
} from '../../utils/faceRecognition.js';
import {
    uploadToS3,
    deleteMultipleFromS3,
    getStudentPresignedUrls
} from '../../utils/s3.js';

const getUploadedFilePaths = (files) => {
    if (!files) return [];

    if (Array.isArray(files)) {
        return files.map((file) => file?.path).filter(Boolean);
    }

    if (typeof files === 'object') {
        return Object.values(files).
        flat().
        map((file) => file?.path).
        filter(Boolean);
    }

    return [];
};

const getStudents = asyncHandler(async (req, res) => {
    let {
        searchQuery,
        branchIds,
        semesterNumbers,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        semesterId,
        batchId,
        schemeId,
        divisionId,
        dropoutAcademicStartYear,
        dropoutAcademicEndYear,
        admissionTypes,
        admissionYear,
        biometricVerificationStatus,
        currentBatch = false,
        currentDivision = false,
        currentSemester = false,
        divisionCode,
        batchCode,
        page = 1,
        limit = 10,
        getAll = false,
        intention = null
    } = req.query;

    if (branchIds && !Array.isArray(branchIds)) {
        branchIds = [branchIds];
    }

    if (semesterNumbers && !Array.isArray(semesterNumbers)) {
        semesterNumbers = [semesterNumbers];
    }
    if (semesterNumbers) {
        semesterNumbers = semesterNumbers.map((semesterNumber) => Number(semesterNumber));
    }
    if (admissionTypes && !Array.isArray(admissionTypes)) {
        admissionTypes = [admissionTypes];
    }
    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    if (searchQuery) {
        const normalizedSearch = searchQuery.trim().replace(/\s+/g, " ");

        searchClause = {
            [Op.or]: [{
                    firstName: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },
                {
                    middleName: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },
                {
                    lastName: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },
                {
                    email: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },
                {
                    phoneNumber: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },
                {
                    prn: {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                },

                where(
                    literal(`
                    trim(
                        concat(
                            coalesce("Student"."first_name", ''),
                            ' ',
                            coalesce("Student"."last_name", '')
                        )
                    )
                `), {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                ),

                where(
                    literal(`
                    regexp_replace(
                        trim(
                            concat(
                                coalesce("Student"."first_name", ''),
                                ' ',
                                coalesce("Student"."middle_name", ''),
                                ' ',
                                coalesce("Student"."last_name", '')
                            )
                        ),
                        '\\s+',
                        ' ',
                        'g'
                    )
                `), {
                        [Op.iLike]: `%${normalizedSearch}%`
                    }
                )
            ]

        };
    }

    let admissionYearFilterClause = {};
    let admissionTypeFilterClause = {};
    let schemeFilterClause = {};
    let branchFilterClause = {};
    let biometricVerificationStatusFilterClause = {};

    if (admissionYear) {
        admissionYearFilterClause.admissionYear = {
            [Op.eq]: Number(admissionYear)
        };
    }

    if (admissionTypes) {
        admissionTypeFilterClause.admissionType = {
            [Op.in]: admissionTypes
        };
    }

    if (schemeId) {
        schemeFilterClause.id = schemeId;
    }

    if (branchIds) {
        branchFilterClause.branchId = {
            [Op.in]: branchIds
        };
    }

    if (biometricVerificationStatus) {
        biometricVerificationStatusFilterClause.biometricVerificationStatus = {
            [Op.eq]: biometricVerificationStatus
        };
    }

    if (academicStartYearOfSemester) {
        academicStartYearOfSemester = Number(academicStartYearOfSemester);
    }

    if (academicEndYearOfSemester) {
        academicEndYearOfSemester = Number(academicEndYearOfSemester);
    }

    if (dropoutAcademicStartYear) {
        dropoutAcademicStartYear = Number(dropoutAcademicStartYear);
    }

    if (dropoutAcademicEndYear) {
        dropoutAcademicEndYear = Number(dropoutAcademicEndYear);
    }

    const currentDate = new Date();

    const students = await Student.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                admissionTypeFilterClause,
                admissionYearFilterClause,
                branchFilterClause,
                biometricVerificationStatusFilterClause
            ]

        },
        distinct: true,
        include: [{
                model: StudentSemester,
                required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester || semesterId ? true : false,
                duplicating: false,
                include: [{
                    model: Semester,
                    required: semesterNumbers || academicStartYearOfSemester || academicEndYearOfSemester || semesterId ? true : false,
                    where: {
                        [Op.and]: [
                            ...(semesterNumbers ? [{
                                semesterNumber: {
                                    [Op.in]: semesterNumbers
                                }
                            }] : []),
                            ...(currentSemester === true ? [{
                                endDate: {
                                    [Op.gte]: currentDate
                                },
                                startDate: {
                                    [Op.lte]: currentDate
                                }
                            }] : []),
                            ...(academicStartYearOfSemester ? [{
                                academicStartYear: {
                                    [Op.gte]: academicStartYearOfSemester
                                }
                            }] : []),
                            ...(academicEndYearOfSemester ? [{
                                academicEndYear: {
                                    [Op.lte]: academicEndYearOfSemester
                                }
                            }] : []),
                            ...(semesterId ? [{
                                id: semesterId
                            }] : [])
                        ]

                    },
                    duplicating: false
                }]

            },
            {
                model: Branch,
                required: true,
                duplicating: false
            },
            {
                model: StudentDivision,
                required: divisionId || divisionCode || intention == "MODIFY_STUDENT_DIVISION" ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{
                            divisionId: divisionId
                        }] : []),
                        ...(currentDivision === true ? [{
                            endDate: null
                        }] : [])
                    ]

                },
                include: [{
                    model: Division,
                    required: divisionId || divisionCode || intention == "MODIFY_STUDENT_DIVISION" ? true : false,
                    duplicating: false,
                    where: {
                        [Op.and]: [
                            ...(divisionCode ? [{
                                divisionCode
                            }] : [])
                        ]

                    }
                }]

            },
            {
                model: StudentBatch,
                required: batchCode || batchId || intention == "MODIFY_STUDENT_BATCH" ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(batchId ? [{
                            batchId: batchId
                        }] : []),
                        ...(currentBatch === true ? [{
                            endDate: null
                        }] : [])
                    ]

                },
                include: [{
                    model: Batch,
                    required: batchCode || batchId || intention == "MODIFY_STUDENT_BATCH" ? true : false,
                    duplicating: false,
                    where: {
                        [Op.and]: [
                            ...(batchCode ? [{
                                batchCode
                            }] : [])
                        ]

                    }
                }]

            },
            {
                model: Scheme,
                required: true,
                duplicating: false,
                where: schemeFilterClause
            },
            {
                model: Dropout,
                required: dropoutAcademicEndYear || dropoutAcademicStartYear ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(dropoutAcademicEndYear ? [{
                            academicEndYear: {
                                [Op.lte]: dropoutAcademicEndYear
                            }
                        }] : []),
                        ...(dropoutAcademicStartYear ? [{
                            academicStartYear: {
                                [Op.gte]: dropoutAcademicStartYear
                            }
                        }] : [])
                    ]

                }
            }
        ],

        ...(limit && getAll === false ? {
            offset: offset
        } : {}),
        ...(limit && getAll === false ? {
            limit: parseInt(limit, 10)
        } : {})
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Students retrieved successfully.", {
                students: students.rows,
                totalStudents: students.count
            }
        )
    );

});

const addStudent = asyncHandler(async (req, res) => {
    const {
        prn,
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        gender,
        dob,
        schemeId,
        admissionYear,
        admissionType,
        branchId,
        parentEmail
    } = req.body;
    const studentImageLocalPath = req?.file?.path;

    const existingStudent = await Student.findOne({
        where: {
            email
        }
    });

    if (existingStudent) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.BAD_REQUEST, "A student with this email already exists");
    }

    const scheme = await Scheme.findByPk(schemeId);
    if (!scheme) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
    }

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
    }

    let studentImageUrl = null;
    let studentImagePublicId = null;

    if (studentImageLocalPath) {
        const studentImage = await uploadOnCloudinary(studentImageLocalPath);
        if (!studentImage?.url) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading image");
        }
        studentImageUrl = studentImage.secure_url;
        studentImagePublicId = studentImage.public_id;
    }

    let dobForDB = null;
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
    }
    const addedStudent = await Student.create({
        prn,
        firstName,
        middleName: middleName || null,
        lastName,
        email,
        phoneNumber,
        parentEmail: parentEmail || null,
        gender: gender || null,
        dob: dobForDB,
        studentImgUrl: studentImageUrl,
        studentImgPublicId: studentImagePublicId,
        schemeId,
        admissionYear: Number(admissionYear) || null,
        admissionType: admissionType,
        branchId: branchId
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Student added successfully", addedStudent));
});

const updateStudentDetails = asyncHandler(async (req, res) => {
    const {
        id,
        firstName,
        middleName,
        lastName,
        email,
        gender,
        phoneNumber,
        dob,
        schemeId,
        branchId,
        parentEmail,
        prn,
        admissionYear,
        admissionType
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    let dobForDB = null;
    if (dob) {
        dobForDB = moment(dob, "YYYY/MM/DD").toDate();

        if (new Date() < dobForDB) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Date of birth cannot be in the future");
        }
    }

    if (schemeId) {
        const scheme = await Scheme.findByPk(schemeId);
        if (!scheme) {
            throw new ApiError(httpStatus.NOT_FOUND, "Scheme not found");
        }
    }

    if (branchId) {
        const branch = await Branch.findByPk(branchId);
        if (!branch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Branch not found");
        }
    }

    student.firstName = firstName || student.firstName;
    student.middleName = middleName || student.middleName;
    student.lastName = lastName || student.lastName;
    student.email = email || student.email;
    student.gender = gender || student.gender;
    student.phoneNumber = phoneNumber || student.phoneNumber;
    student.dob = dobForDB || student.dob;
    student.schemeId = schemeId || student.schemeId;
    student.branchId = branchId || student.branchId;
    student.parentEmail = parentEmail || student.parentEmail;
    student.prn = prn || student.prn;
    student.admissionYear = admissionYear || student.admissionYear;
    student.admissionType = admissionType || student.admissionType;

    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student updated successfully", student));
});

const updateStudentPassword = asyncHandler(async (req, res) => {
    const {
        id,
        password,
        confirmPassword
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    student.password = password;
    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student password updated successfully", student));
});

const updateStudentImage = asyncHandler(async (req, res) => {
    const {
        id
    } = req.body;
    const studentImageLocalPath = req.file?.path;

    const student = await Student.findByPk(id);
    if (!student) {
        if (studentImageLocalPath) fs.unlinkSync(studentImageLocalPath);
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (!studentImageLocalPath) throw new ApiError(httpStatus.BAD_REQUEST, "Student image file is required");

    const uploadedImageResponse = await uploadOnCloudinary(studentImageLocalPath);
    if (!uploadedImageResponse?.url) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error uploading image");

    student.studentImgUrl = uploadedImageResponse.secure_url;
    student.studentImgPublicId = uploadedImageResponse.public_id;

    await student.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student image updated successfully", {
        student
    }));
});

const removeStudentImage = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.query;

    const student = await Student.findByPk(studentId);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    if (student.studentImgPublicId == null) throw new ApiError(httpStatus.BAD_REQUEST, "There is no student image uploaded to remove");
    const deletedImage = await deleteFromCloudinary(student.studentImgPublicId);
    if (!deletedImage) throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Error deleting image");

    student.studentImgUrl = null;
    student.studentImgPublicId = null;

    await student.save();
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student image deleted successfully", student));
});

const removeStudent = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const student = await Student.findByPk(id);
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    await deleteFromCloudinary(student.studentImagePublicId);
    await student.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Student deleted successfully", null));
});

const getStudentDetailsById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const student = await Student.findOne({
        where: {
            id: id
        },
        attributes: {
            exclude: ['password', 'refreshToken']
        },
        include: [{
                model: Branch,
                required: true
            },
            {
                model: Scheme,
                required: true
            },
            {
                model: StudentSemester,
                include: [{
                    model: Semester,
                    required: true
                }]

            },
            {
                model: StudentDivision,
                include: [{
                    model: Division,
                    required: true,
                    include: [{
                        model: Semester,
                        required: true
                    }]

                }]

            },
            {
                model: StudentBatch,
                include: [{
                    model: Batch,
                    required: true,
                    include: [{
                        model: Division,
                        required: true,
                        include: [{
                            model: Semester,
                            required: true
                        }]

                    }]

                }]

            }
        ]

    });
    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student fetched successfully",
            student
        )
    );
});

const getStudentSemestersById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const student = await Student.findByPk(id);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const studentSemesters = await StudentSemester.findAll({
        where: {
            studentId: id
        },
        include: [{
            model: Semester,
            required: true
        }]

    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student semesters fetched successfully",
            studentSemesters
        )
    );
});

const getStudentDivisionsById = asyncHandler(async (req, res) => {
    const {
        studentId,
        semesterNumber
    } = req.query;

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const semesterNumberClause = {};

    if (semesterNumber) {
        semesterNumberClause.semesterNumber = semesterNumber;
    }

    const studentDivisions = await StudentDivision.findAll({
        where: {
            studentId: studentId
        },
        include: [{
            model: Division,
            required: true,
            include: [{
                model: Semester,
                required: true,
                where: semesterNumberClause
            }]

        }]

    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student's divisions fetched successfully",
            studentDivisions
        )
    );
});

const getStudentBatchesById = asyncHandler(async (req, res) => {
    const {
        studentId,
        semesterNumber
    } = req.query;

    const student = await Student.findByPk(studentId);

    if (!student) throw new ApiError(httpStatus.NOT_FOUND, "Student not found");

    const semesterNumberClause = {};

    if (semesterNumber) {
        semesterNumberClause.semesterNumber = semesterNumber;
    }

    const studentBatches = await StudentBatch.findAll({
        where: {
            studentId: studentId
        },
        include: [{
            model: Batch,
            required: true,
            include: [{
                model: Division,
                required: true,
                include: [{
                    model: Semester,
                    required: true,
                    where: semesterNumberClause
                }]

            }]

        }]

    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student's batches fetched successfully",
            studentBatches
        )
    );
});

const addStudentToSemester = asyncHandler(async (req, res) => {
    const {
        studentId,
        semesterId
    } = req.body;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const semester = await Semester.findByPk(semesterId);

    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    if (student.branchId !== semester.branchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is not present in the same branch as the semester`);
    }

    const alreadyExists = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: semesterId
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is already present in this semester`);
    }

    const semesterNumberToAdd = semester.semesterNumber;
    let validSemesterNumber;

    if (semesterNumberToAdd == 1) {
        validSemesterNumber = 2;
    } else if (semesterNumberToAdd == 2) {
        validSemesterNumber = 1;
    } else if (semesterNumberToAdd == 3) {
        validSemesterNumber = 4;
    } else if (semesterNumberToAdd == 4) {
        validSemesterNumber = 3;
    } else if (semesterNumberToAdd == 5) {
        validSemesterNumber = 6;
    } else if (semesterNumberToAdd == 6) {
        validSemesterNumber = 5;
    } else if (semesterNumberToAdd == 7) {
        validSemesterNumber = 8;
    } else if (semesterNumberToAdd == 8) {
        validSemesterNumber = 7;
    }

    const alreadyExistsInOtherSemesterForSameAcademicYear = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: {
                [Op.ne]: semesterId
            }
        },
        include: [{
            model: Semester,
            required: true,
            where: {
                academicStartYear: semester.academicStartYear,
                academicEndYear: semester.academicEndYear,
                semesterNumber: {
                    [Op.ne]: validSemesterNumber
                }
            }
        }]

    });

    if (alreadyExistsInOtherSemesterForSameAcademicYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is already added in other semester for the same academic year`);
    }

    const studentDropout = await Dropout.findOne({
        where: {
            academicEndYear: semester.academicEndYear,
            academicStartYear: semester.academicStartYear,
            studentId: studentId
        }
    });

    if (studentDropout) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Student is in drop-out list for the same academic year of semester's`);
    }

    const studentSemesterEntry = await StudentSemester.create({
        studentId: studentId,
        semesterId: semesterId
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student added successfully",
            studentSemesterEntry
        )
    );
});

const removeStudentFromSemester = asyncHandler(async (req, res) => {
    const {
        studentSemesterId
    } = req.query;

    const studentSemester = await StudentSemester.findByPk(studentSemesterId);

    if (!studentSemester) {
        throw new ApiError(httpStatus.NOT_FOUND, "StudentSemester not found");
    }

    const transaction = await sequelize.transaction();
    try {
        const divisionsThatBelongToThisSemester = await Division.findAll({
            where: {
                semesterId: studentSemester.semesterId
            },
            transaction
        });

        await StudentDivision.destroy({
            where: {
                studentId: studentSemester.studentId,
                divisionId: {
                    [Op.in]: divisionsThatBelongToThisSemester.map((division) => division.id)
                }
            },
            transaction
        });

        const batchesOfCurrentSemester = await Batch.findAll({
            where: {
                divisionId: {
                    [Op.in]: divisionsThatBelongToThisSemester.map((division) => division.id)
                }
            },
            transaction
        });

        await StudentBatch.destroy({
            where: {
                studentId: studentSemester.studentId,
                batchId: {
                    [Op.in]: batchesOfCurrentSemester.map((batch) => batch.id)
                }
            },
            transaction
        });

        await studentSemester.destroy({
            transaction
        });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            `Student is removed from the semester`,
            null
        )
    );
});

const addStudentToDivision = asyncHandler(async (req, res) => {
    const {
        studentId,
        divisionId
    } = req.body;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const division = await Division.findByPk(divisionId);

    const semester = await Semester.findByPk(division.semesterId);

    const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
        where: {
            studentId: studentId,
            semesterId: division.semesterId
        }
    });

    if (!isStudentInSameSemesterAsDivision) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same semester as the division");
    }

    const alreadyExists = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: divisionId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in this division");
    }

    const divisionsOfTheSemester = await Division.findAll({
        where: {
            semesterId: division.semesterId,
            id: {
                [Op.ne]: divisionId
            }
        }
    });

    const studentPresentInOtherDivisions = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: {
                [Op.in]: divisionsOfTheSemester.map((division) => division.id)
            }
        }
    });

    if (studentPresentInOtherDivisions) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other division of the same semester. Please use the change division feature for moving student to different divsion.");
    }

    const allSemesterDivisionIds = [
        divisionId,
        ...divisionsOfTheSemester.map((d) => d.id)
    ];

    const maxRollNo = await StudentDivision.max('rollNo', {
        where: {
            divisionId: {
                [Op.in]: allSemesterDivisionIds
            }
        }
    });

    const studentDivisionEntry = await StudentDivision.create({
        studentId: studentId,
        divisionId: divisionId,
        startDate: semester.startDate,
        rollNo: (maxRollNo || 0) + 1
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student added successfully",
            studentDivisionEntry
        )
    );

});

const changeStudentDivision = asyncHandler(async (req, res) => {
    const {
        studentDivisionId,
        divisionId,
        newDivisionStartDate
    } = req.body;

    const studentDivision = await StudentDivision.findByPk(studentDivisionId);

    if (!studentDivision) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student's previous division is not found");
    }

    if (studentDivision.endDate != null) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid previous division.");
    }

    const division = await Division.findByPk(divisionId);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division is not found");
    }

    if (studentDivision.divisionId === divisionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student's new division can't be same as previous division");
    }

    const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
        where: {
            studentId: studentDivision.studentId,
            semesterId: division.semesterId
        }
    });

    if (!isStudentInSameSemesterAsDivision) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same semester as the new division");
    }

    const startDateOfNewDivision = new Date(newDivisionStartDate);

    if (isNaN(startDateOfNewDivision.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format for new division start date");
    }

    const semester = await Semester.findByPk(division.semesterId);

    if (startDateOfNewDivision.toISOString().split('T')[0] <= studentDivision.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New division start date cannot be lesser than or same as previous division start date");
    }

    if (startDateOfNewDivision.toISOString().split('T')[0] >= semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New division start date cannot be greater than end date of the semester");
    }

    const endDateOfPrevDivision = new Date(startDateOfNewDivision.getFullYear(), startDateOfNewDivision.getMonth(), startDateOfNewDivision.getDate() - 1);

    const transaction = await sequelize.transaction();
    try {
        const batchesOfCurrentDivision = await Batch.findAll({
            where: {
                divisionId: studentDivision.divisionId
            },
            transaction
        });

        const studentBatch = await StudentBatch.findOne({
            where: {
                studentId: studentDivision.studentId,
                batchId: {
                    [Op.in]: batchesOfCurrentDivision.map((batch) => batch.id)
                },
                endDate: null
            },
            transaction
        });

        if (studentBatch) {
            if (studentBatch.startDate > startDateOfNewDivision.toISOString().split('T')[0]) {
                const futureBatchStartDateObj = new Date(studentBatch.startDate);
                const prevBatchEndDateObj = new Date(futureBatchStartDateObj.getFullYear(), futureBatchStartDateObj.getMonth(), futureBatchStartDateObj.getDate());

                const previousBatch = await StudentBatch.findOne({
                    where: {
                        studentId: studentDivision.studentId,
                        endDate: prevBatchEndDateObj.toISOString().split('T')[0]
                    },
                    include: [{
                        model: Batch,
                        required: true,
                        where: {
                            divisionId: studentDivision.divisionId
                        }
                    }],

                    transaction
                });

                await studentBatch.destroy({
                    transaction
                });

                if (previousBatch) {
                    previousBatch.endDate = endDateOfPrevDivision;
                    await previousBatch.save({
                        transaction
                    });
                }
            } else {
                studentBatch.endDate = endDateOfPrevDivision;
                await studentBatch.save({
                    transaction
                });
            }
        }

        studentDivision.endDate = endDateOfPrevDivision;
        await studentDivision.save({
            transaction
        });

        const semesterDivisions = await Division.findAll({
            where: {
                semesterId: division.semesterId
            },
            transaction
        });

        const semesterDivisionIds = semesterDivisions.map((d) => d.id);

        const maxRollNoNewDivision = await StudentDivision.max('rollNo', {
            where: {
                divisionId: {
                    [Op.in]: semesterDivisionIds
                }
            },
            transaction
        });

        const newStudentDivision = await StudentDivision.create({
            studentId: studentDivision.studentId,
            divisionId: divisionId,
            startDate: startDateOfNewDivision,
            rollNo: (maxRollNoNewDivision || 0) + 1
        }, {
            transaction
        });

        if (!newStudentDivision) {
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while changing division");
        }
        await transaction.commit();
        res.
        status(httpStatus.OK).
        json(
            new ApiResponse(
                httpStatus.OK,
                "Student's division is changed successfully",
                newStudentDivision
            )
        );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

});

const addStudentToBatch = asyncHandler(async (req, res) => {
    const {
        studentId,
        batchId
    } = req.body;

    const student = await Student.findByPk(studentId);

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same division as the batch");
    }

    const alreadyExists = await StudentBatch.findOne({
        where: {
            studentId: studentId,
            batchId: batchId,
            endDate: null
        }
    });

    if (alreadyExists) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in this batch");
    }

    const batchesOfTheDivision = await Batch.findAll({
        where: {
            divisionId: batch.divisionId,
            id: {
                [Op.ne]: batchId
            }
        }
    });

    const studentPresentInOtherBatches = await StudentBatch.findOne({
        where: {
            studentId: studentId,
            batchId: {
                [Op.in]: batchesOfTheDivision.map((batch) => batch.id)
            },
            endDate: null
        }
    });

    if (studentPresentInOtherBatches) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is already present in other batch of the same division. Please use the change division feature for moving student to different batch.");
    }

    const studentBatchEntry = await StudentBatch.create({
        studentId: studentId,
        batchId: batchId,
        startDate: isStudentInSameDivisionAsBatch.startDate
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Student added to batch successfully",
            studentBatchEntry
        )
    );

});

const changeStudentBatch = asyncHandler(async (req, res, next) => {

    const {
        studentBatchId,
        batchId,
        newBatchStartDate
    } = req.body;

    const studentBatch = await StudentBatch.findByPk(studentBatchId);

    if (!studentBatch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student's previous batch is not found");
    }

    if (studentBatch.endDate != null) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid previous batch.");
    }

    const batch = await Batch.findByPk(batchId);

    if (!batch) {
        throw new ApiError(httpStatus.NOT_FOUND, "Batch is not found");
    }

    if (studentBatch.batchId === batchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student's new batch can't be same as previous batch");
    }

    const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
        where: {
            studentId: studentBatch.studentId,
            divisionId: batch.divisionId,
            endDate: null
        }
    });

    if (!isStudentInSameDivisionAsBatch) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student is not present in the same division as the batch");
    }

    const division = await Division.findByPk(batch.divisionId);
    const semester = await Semester.findByPk(division.semesterId);

    const startDateOfNewBatch = new Date(newBatchStartDate);

    if (isNaN(startDateOfNewBatch.getTime())) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Invalid date format for new division start date");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be greater than end date of the semester");
    }

    if (startDateOfNewBatch.toISOString().split('T')[0] <= studentBatch.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    const endDateOfPrevBatch = new Date(startDateOfNewBatch.getFullYear(), startDateOfNewBatch.getMonth(), startDateOfNewBatch.getDate() - 1);

    if (studentBatch.startDate >= startDateOfNewBatch.toISOString().split('T')[0]) {
        throw new ApiError(httpStatus.BAD_REQUEST, "New batch start date cannot be lesser than or same as previous batch start date");
    }

    const transaction = await sequelize.transaction();
    try {
        studentBatch.endDate = endDateOfPrevBatch;
        await studentBatch.save({
            transaction
        });

        const newStudentBatch = await StudentBatch.create({
            studentId: studentBatch.studentId,
            batchId: batchId,
            startDate: startDateOfNewBatch
        }, {
            transaction
        });

        await transaction.commit();
        res.
        status(httpStatus.OK).
        json(
            new ApiResponse(
                httpStatus.OK,
                "Student's batch is changed successfully",
                newStudentBatch
            )
        );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

});

const revertAddStudentToDivision = asyncHandler(async (req, res) => {
    const {
        studentDivisionId
    } = req.body;

    const studentDivision = await StudentDivision.findByPk(studentDivisionId);
    if (!studentDivision) throw new ApiError(httpStatus.NOT_FOUND, "StudentDivision not found");
    if (studentDivision.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "StudentDivision is not active");

    const latestActiveDivision = await StudentDivision.findOne({
        where: {
            studentId: studentDivision.studentId,
            endDate: null
        },
        order: [
            ["startDate", "DESC"]
        ]
    });
    if (!latestActiveDivision || latestActiveDivision.id !== studentDivision.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active division can be reverted");
    }

    const transaction = await sequelize.transaction();
    try {

        const batchesInDivision = await Batch.findAll({
            where: {
                divisionId: studentDivision.divisionId
            },
            transaction
        });
        await StudentBatch.destroy({
            where: {
                studentId: studentDivision.studentId,
                batchId: {
                    [Op.in]: batchesInDivision.map((b) => b.id)
                },
                endDate: null
            },
            transaction
        });

        await studentDivision.destroy({
            transaction
        });
        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted addStudentToDivision successfully", null));
});

const revertChangeStudentDivision = asyncHandler(async (req, res) => {
    const {
        newStudentDivisionId
    } = req.body;

    const newDivision = await StudentDivision.findByPk(newStudentDivisionId, {
        include: [{
            model: Division,
            required: true
        }]

    });
    if (!newDivision) throw new ApiError(httpStatus.NOT_FOUND, "New StudentDivision not found");
    if (newDivision.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "Student is not active in this division now to revert");

    const latestActiveDivision = await StudentDivision.findOne({
        where: {
            studentId: newDivision.studentId,
            endDate: null
        },
        include: [{
            model: Division,
            required: true,
            where: {
                semesterId: newDivision.Division.semesterId
            }
        }],

        order: [
            ["startDate", "DESC"]
        ]
    });
    if (!latestActiveDivision || latestActiveDivision.id !== newDivision.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active division change or assignment can be reverted");
    }

    const prevDivision = await StudentDivision.findOne({
        where: {
            studentId: newDivision.studentId,
            endDate: {
                [Op.ne]: null
            }
        },
        include: [{
            model: Division,
            required: true,
            where: {
                semesterId: newDivision.Division.semesterId
            }
        }],

        order: [
            ["endDate", "DESC"]
        ]
    });
    if (!prevDivision) throw new ApiError(httpStatus.BAD_REQUEST, "This is initial division assignment for the student in this semester, no previous division found for revert. Use Unassgign division option if you wish to just remove the division assignment.");

    const transaction = await sequelize.transaction();
    try {

        const batchesInNewDivision = await Batch.findAll({
            where: {
                divisionId: newDivision.divisionId
            },
            transaction
        });
        await StudentBatch.destroy({
            where: {
                studentId: newDivision.studentId,
                batchId: {
                    [Op.in]: batchesInNewDivision.map((b) => b.id)
                },
                startDate: {
                    [Op.gte]: newDivision.startDate
                }
            },
            transaction
        });

        if (prevDivision) {

            const prevDivisionEndDate = prevDivision.endDate;

            prevDivision.endDate = null;
            await prevDivision.save({
                transaction
            });

            const batchesInPrevDivision = await Batch.findAll({
                where: {
                    divisionId: prevDivision.divisionId
                },
                transaction
            });
            await StudentBatch.update({
                endDate: null
            }, {
                where: {
                    studentId: newDivision.studentId,
                    batchId: {
                        [Op.in]: batchesInPrevDivision.map((b) => b.id)
                    },
                    endDate: prevDivisionEndDate
                },
                transaction
            });
        }

        await newDivision.destroy({
            transaction
        });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted changeStudentDivision successfully", null));
});

const revertAddStudentToBatch = asyncHandler(async (req, res) => {
    const {
        studentBatchId
    } = req.body;

    const studentBatch = await StudentBatch.findByPk(studentBatchId);
    if (!studentBatch) throw new ApiError(httpStatus.NOT_FOUND, "StudentBatch not found");
    if (studentBatch.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "StudentBatch is not active");

    const activeBatch = await StudentBatch.findOne({
        where: {
            studentId: studentBatch.studentId,
            endDate: null
        },
        order: [
            ["startDate", "DESC"]
        ]
    });
    if (!activeBatch || activeBatch.id !== studentBatch.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active batch can be reverted");
    }

    await studentBatch.destroy();
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted addStudentToBatch successfully", null));
});

const revertChangeStudentBatch = asyncHandler(async (req, res) => {
    const {
        newStudentBatchId
    } = req.body;

    const newBatch = await StudentBatch.findByPk(newStudentBatchId, {
        include: [{
            model: Batch,
            required: true
        }]

    });
    if (!newBatch) throw new ApiError(httpStatus.NOT_FOUND, "New StudentBatch not found");
    if (newBatch.endDate !== null) throw new ApiError(httpStatus.BAD_REQUEST, "Student is not active in this batch now to revert");

    const latestActiveBatch = await StudentBatch.findOne({
        where: {
            studentId: newBatch.studentId,
            endDate: null
        },
        include: [{
            model: Batch,
            required: true,
            where: {
                divisionId: newBatch.Batch.divisionId
            }
        }],

        order: [
            ["startDate", "DESC"]
        ]
    });
    if (!latestActiveBatch || latestActiveBatch.id !== newBatch.id) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Only the latest active batch change or assignment can be reverted");
    }

    const prevBatch = await StudentBatch.findOne({
        where: {
            studentId: newBatch.studentId,
            endDate: {
                [Op.ne]: null
            }
        },
        include: [{
            model: Batch,
            required: true,
            where: {
                divisionId: newBatch.Batch.divisionId
            }
        }],

        order: [
            ["endDate", "DESC"]
        ]
    });
    if (!prevBatch) throw new ApiError(httpStatus.BAD_REQUEST, "This is initial batch assignment for the student in this division, no previous batch found for revert. Use Unassgign batch option if you wish to just remove the batch assignment.");

    const transaction = await sequelize.transaction();
    try {
        if (prevBatch) {

            prevBatch.endDate = null;
            await prevBatch.save({
                transaction
            });
        }

        await newBatch.destroy({
            transaction
        });

        await transaction.commit();
    } catch (error) {
        await transaction.rollback();
        throw error;
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Reverted changeStudentBatch successfully", null));
});

const bulkCreateStudents = asyncHandler(async (req, res) => {
    const {
        students
    } = req.body;

    if (!students || !Array.isArray(students) || students.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Students array is required and must not be empty");
    }

    const transaction = await sequelize.transaction();
    try {
        const createdStudents = [];
        const errors = [];

        for (let i = 0; i < students.length; i++) {
            const studentData = students[i];
            try {

                if (!studentData.prn || !studentData.firstName || !studentData.lastName ||
                    !studentData.email || !studentData.phoneNumber || !studentData.branchId ||
                    !studentData.schemeId || !studentData.admissionType) {
                    errors.push({
                        index: i,
                        error: "Missing required fields"
                    });
                    continue;
                }

                const existingStudent = await Student.findOne({
                    where: {
                        prn: studentData.prn
                    },
                    transaction
                });

                if (existingStudent) {
                    errors.push({
                        index: i,
                        error: `PRN ${studentData.prn} already exists`
                    });
                    continue;
                }

                if (!isValidPhoneNumber(studentData.phoneNumber, 'IN')) {
                    errors.push({
                        index: i,
                        error: "Invalid phone number"
                    });
                    continue;
                }

                let dobForDB = null;
                if (studentData.dob) {
                    dobForDB = moment(studentData.dob, "YYYY/MM/DD").toDate();
                    if (new Date() < dobForDB) {
                        errors.push({
                            index: i,
                            error: "Date of birth cannot be in the future"
                        });
                        continue;
                    }
                }

                const student = await Student.create({
                    prn: studentData.prn,
                    firstName: studentData.firstName,
                    middleName: studentData.middleName || null,
                    lastName: studentData.lastName,
                    email: studentData.email,
                    phoneNumber: studentData.phoneNumber,
                    parentEmail: studentData.parentEmail || null,
                    gender: studentData.gender || null,
                    dob: dobForDB,
                    studentImgUrl: null,
                    studentImgPublicId: null,
                    schemeId: studentData.schemeId,
                    admissionYear: Number(studentData.admissionYear) || null,
                    admissionType: studentData.admissionType,
                    branchId: studentData.branchId
                }, {
                    transaction
                });

                createdStudents.push(student);

            } catch (error) {
                errors.push({
                    index: i,
                    error: error.message
                });
            }
        }

        await transaction.commit();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk student creation completed. Created: ${createdStudents.length}, Errors: ${errors.length}`, {
                    createdStudents,
                    errors,
                    summary: {
                        total: students.length,
                        created: createdStudents.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Bulk student creation failed");
    }
});

const bulkDeleteStudents = asyncHandler(async (req, res) => {
    const {
        studentIds
    } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    const transaction = await sequelize.transaction();
    try {
        const students = await Student.findAll({
            where: {
                id: {
                    [Op.in]: studentIds
                }
            },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentsWithImages = students.filter((student) => student.studentImgPublicId);
        for (const student of studentsWithImages) {
            try {
                await deleteFromCloudinary(student.studentImgPublicId);
            } catch (error) {

            }
        }

        const deletedCount = await Student.destroy({
            where: {
                id: {
                    [Op.in]: studentIds
                }
            },
            transaction
        });

        await transaction.commit();

        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Students deleted successfully", {
                    deletedCount,
                    requestedCount: studentIds.length
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const bulkAddStudentsToSemester = asyncHandler(async (req, res) => {
    const {
        studentIds,
        semesterId
    } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!semesterId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Semester ID is required");
    }

    const transaction = await sequelize.transaction();
    try {
        const semester = await Semester.findByPk(semesterId, {
            transaction
        });
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
        }

        const students = await Student.findAll({
            where: {
                id: {
                    [Op.in]: studentIds
                }
            },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentSemesterData = [];
        const errors = [];

        for (const student of students) {
            try {

                const existingStudentSemester = await StudentSemester.findOne({
                    where: {
                        studentId: student.id,
                        semesterId: semesterId
                    },
                    transaction
                });

                if (existingStudentSemester) {
                    errors.push({
                        studentId: student.id,
                        error: "Student already in this semester"
                    });
                    continue;
                }

                studentSemesterData.push({
                    studentId: student.id,
                    semesterId: semesterId
                });

            } catch (error) {
                errors.push({
                    studentId: student.id,
                    error: error.message
                });
            }
        }

        let created = [];
        if (studentSemesterData.length > 0) {
            created = await StudentSemester.bulkCreate(studentSemesterData, {
                transaction
            });
        }

        await transaction.commit();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to semester completed. Added: ${created.length}, Errors: ${errors.length}`, {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const bulkAddStudentsToDivision = asyncHandler(async (req, res) => {
    const {
        studentIds,
        divisionId
    } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!divisionId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Division ID is required");
    }

    const transaction = await sequelize.transaction();
    try {
        const division = await Division.findByPk(divisionId, {
            transaction
        });
        if (!division) {
            throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
        }

        const students = await Student.findAll({
            where: {
                id: {
                    [Op.in]: studentIds
                }
            },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentDivisionData = [];
        const errors = [];

        for (const student of students) {
            try {

                const semester = await Semester.findByPk(division.semesterId, {
                    transaction
                });

                const isStudentInSameSemesterAsDivision = await StudentSemester.findOne({
                    where: {
                        studentId: student.id,
                        semesterId: semester.id
                    },
                    transaction
                });

                if (!isStudentInSameSemesterAsDivision) {
                    errors.push({
                        studentId: student.id,
                        error: "Student not in the same semester as division"
                    });
                    continue;
                }

                const existingStudentDivision = await StudentDivision.findOne({
                    where: {
                        studentId: student.id,
                        divisionId: divisionId,
                        endDate: null
                    },
                    transaction
                });

                if (existingStudentDivision) {
                    errors.push({
                        studentId: student.id,
                        error: "Student already in this division"
                    });
                    continue;
                }

                studentDivisionData.push({
                    studentId: student.id,
                    divisionId: divisionId,
                    startDate: new Date().toISOString().split('T')[0]
                });

            } catch (error) {
                errors.push({
                    studentId: student.id,
                    error: error.message
                });
            }
        }

        let created = [];
        if (studentDivisionData.length > 0) {
            created = await StudentDivision.bulkCreate(studentDivisionData, {
                transaction
            });
        }

        await transaction.commit();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to division completed. Added: ${created.length}, Errors: ${errors.length}`, {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const bulkAddStudentsToBatch = asyncHandler(async (req, res) => {
    const {
        studentIds,
        batchId
    } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student IDs array is required and must not be empty");
    }

    if (!batchId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Batch ID is required");
    }

    const transaction = await sequelize.transaction();
    try {
        const batch = await Batch.findByPk(batchId, {
            transaction
        });
        if (!batch) {
            throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        }

        const students = await Student.findAll({
            where: {
                id: {
                    [Op.in]: studentIds
                }
            },
            transaction
        });

        if (students.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No students found with provided IDs");
        }

        const studentBatchData = [];
        const errors = [];

        for (const student of students) {
            try {

                const division = await Division.findByPk(batch.divisionId, {
                    transaction
                });

                const isStudentInSameDivisionAsBatch = await StudentDivision.findOne({
                    where: {
                        studentId: student.id,
                        divisionId: division.id,
                        endDate: null
                    },
                    transaction
                });

                if (!isStudentInSameDivisionAsBatch) {
                    errors.push({
                        studentId: student.id,
                        error: "Student not in the same division as batch"
                    });
                    continue;
                }

                const existingStudentBatch = await StudentBatch.findOne({
                    where: {
                        studentId: student.id,
                        endDate: null
                    },
                    include: [{
                        model: Batch,
                        where: {
                            divisionId: division.id
                        },
                        required: true
                    }],
                    transaction
                });

                if (existingStudentBatch) {
                    errors.push({
                        studentId: student.id,
                        error: "Student already in a batch of this division"
                    });
                    continue;
                }

                studentBatchData.push({
                    studentId: student.id,
                    batchId: batchId,
                    startDate: new Date().toISOString().split('T')[0]
                });

            } catch (error) {
                errors.push({
                    studentId: student.id,
                    error: error.message
                });
            }
        }

        let created = [];
        if (studentBatchData.length > 0) {
            created = await StudentBatch.bulkCreate(studentBatchData, {
                transaction
            });
        }

        await transaction.commit();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk addition to batch completed. Added: ${created.length}, Errors: ${errors.length}`, {
                    created,
                    errors,
                    summary: {
                        total: studentIds.length,
                        added: created.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const bulkCreateStudentsFromCSV = asyncHandler(async (req, res) => {
    const csvFilePath = req?.file?.path;

    if (!csvFilePath) {
        throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is required");
    }

    const cleanupFile = () => {
        if (csvFilePath && fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
        }
    };

    const parseCSV = () => {
        return new Promise((resolve, reject) => {
            const rows = [];
            fs.createReadStream(csvFilePath).
            pipe(csvParser()).
            on('data', (row) => {
                rows.push(row);
            }).
            on('end', () => {
                resolve(rows);
            }).
            on('error', (error) => {
                reject(error);
            });
        });
    };

    let rows;
    try {
        rows = await parseCSV();
    } catch (error) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, `Error parsing CSV file: ${error.message}`);
    }

    if (!rows || rows.length === 0) {
        cleanupFile();
        throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is empty or contains no valid data");
    }

    const globalErrors = [];
    const rowErrorsMap = new Map();

    const requiredColumns = [
        'prn', 'firstName', 'lastName', 'email', 'phoneNumber',
        'gender', 'scheme', 'admissionYear', 'admissionType', 'branch'
    ];

    const actualColumns = Object.keys(rows[0] || {});
    const missingColumns = requiredColumns.filter((col) => !actualColumns.includes(col));

    if (missingColumns.length > 0) {
        globalErrors.push(`Required columns are missing from the CSV header: ${missingColumns.join(', ')}`);
    }

    const addRowError = (rowNumber, prn, field, message, value) => {
        if (!rowErrorsMap.has(rowNumber)) {
            rowErrorsMap.set(rowNumber, {
                rowNumber,
                prn: prn || 'N/A',
                issues: []
            });
        }
        rowErrorsMap.get(rowNumber).issues.push({
            field,
            message,
            value
        });
    };

    const validatedStudents = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2;

        if (row.admissionYear) {
            const parsedYear = parseInt(row.admissionYear, 10);
            if (!isNaN(parsedYear)) {
                row.admissionYear = parsedYear;
            }
        }

        const {
            error,
            value
        } = studentValidation.csvStudentRowSchema.validate(row, {
            abortEarly: false
        });
        if (error) {
            error.details.forEach((detail) => {
                const field = detail.context?.key || 'unknown';
                addRowError(rowNumber, row.prn, field, detail.message, row[field] !== undefined ? row[field] : null);
            });
        } else {
            validatedStudents.push({
                ...value,
                rowNumber
            });
        }
    }

    const transaction = await sequelize.transaction();
    let transactionCommitted = false;

    try {
        let schemeMap = new Map();
        let branchMap = new Map();

        if (validatedStudents.length > 0) {

            const schemeNames = [...new Set(validatedStudents.map((s) => s.scheme))];
            const branchNames = [...new Set(validatedStudents.map((s) => s.branch))];
            const emails = validatedStudents.map((s) => s.email.toLowerCase());
            const prns = validatedStudents.map((s) => s.prn);
            const phoneNumbers = validatedStudents.map((s) => s.phoneNumber);

            const emailSet = new Map();
            for (const student of validatedStudents) {
                const lowerEmail = student.email.toLowerCase();
                if (emailSet.has(lowerEmail)) {
                    addRowError(student.rowNumber, student.prn, "email", "Duplicate email found within the CSV file", student.email);
                } else {
                    emailSet.set(lowerEmail, student.rowNumber);
                }
            }

            const prnSet = new Map();
            for (const student of validatedStudents) {
                if (prnSet.has(student.prn)) {
                    addRowError(student.rowNumber, student.prn, "prn", "Duplicate PRN found within the CSV file", student.prn);
                } else {
                    prnSet.set(student.prn, student.rowNumber);
                }
            }

            const schemes = await Scheme.findAll({
                where: {
                    name: {
                        [Op.in]: schemeNames
                    }
                },
                transaction
            });
            schemeMap = new Map(schemes.map((s) => [s.name, s.id]));

            const branches = await Branch.findAll({
                where: {
                    name: {
                        [Op.in]: branchNames
                    }
                },
                transaction
            });
            branchMap = new Map(branches.map((b) => [b.name, b.id]));

            const existingStudentsByEmail = await Student.findAll({
                where: {
                    email: {
                        [Op.in]: emails
                    }
                },
                transaction
            });
            const existingEmailSet = new Set(existingStudentsByEmail.map((s) => s.email.toLowerCase()));

            const existingStudentsByPrn = await Student.findAll({
                where: {
                    prn: {
                        [Op.in]: prns
                    }
                },
                transaction
            });
            const existingPrnSet = new Set(existingStudentsByPrn.map((s) => s.prn));

            const existingStudentsByPhone = await Student.findAll({
                where: {
                    phoneNumber: {
                        [Op.in]: phoneNumbers
                    }
                },
                transaction
            });
            const existingPhoneSet = new Set(existingStudentsByPhone.map((s) => s.phoneNumber));

            for (const student of validatedStudents) {

                if (student.dob) {
                    const dobForDB = moment(student.dob, "YYYY/MM/DD").toDate();
                    if (new Date() < dobForDB) {
                        addRowError(student.rowNumber, student.prn, "dob", "Date of birth cannot be in the future", student.dob);
                    }
                }

                if (!schemeMap.has(student.scheme)) {
                    addRowError(student.rowNumber, student.prn, "scheme", `Scheme '${student.scheme}' does not exist in the database`, student.scheme);
                }

                if (!branchMap.has(student.branch)) {
                    addRowError(student.rowNumber, student.prn, "branch", `Branch '${student.branch}' does not exist in the database`, student.branch);
                }

                if (existingEmailSet.has(student.email.toLowerCase())) {
                    addRowError(student.rowNumber, student.prn, "email", "Email already exists in the database", student.email);
                }

                if (existingPrnSet.has(student.prn)) {
                    addRowError(student.rowNumber, student.prn, "prn", "PRN already exists in the database", student.prn);
                }

                if (existingPhoneSet.has(student.phoneNumber)) {
                    addRowError(student.rowNumber, student.prn, "phoneNumber", "Phone number already exists in the database", student.phoneNumber);
                }
            }
        }

        if (globalErrors.length > 0 || rowErrorsMap.size > 0) {
            let errorMessage = "CSV processing failed due to validation errors:\n\n";

            if (globalErrors.length > 0) {
                errorMessage += "Global Errors:\n";
                globalErrors.forEach((err) => {
                    errorMessage += `- ${err}\n`;
                });
                errorMessage += "\n";
            }

            if (rowErrorsMap.size > 0) {
                errorMessage += "Row Errors:\n";
                const sortedRowErrors = Array.from(rowErrorsMap.values()).sort((a, b) => a.rowNumber - b.rowNumber);
                sortedRowErrors.forEach((rowError) => {
                    errorMessage += `Row ${rowError.rowNumber} (PRN: ${rowError.prn || 'N/A'}):\n`;
                    rowError.issues.forEach((issue) => {
                        const providedValue = issue.value !== null && issue.value !== undefined && issue.value !== "" ? issue.value : "Empty";
                        errorMessage += `  - [${issue.field}]: ${issue.message} (Value provided: ${providedValue})\n`;
                    });
                });
            }

            throw new ApiError(httpStatus.BAD_REQUEST, errorMessage.trim());
        }

        const studentsToCreate = validatedStudents.map((student) => {
            return {
                prn: student.prn,
                firstName: student.firstName,
                middleName: student.middleName || null,
                lastName: student.lastName,
                email: student.email.toLowerCase(),
                phoneNumber: student.phoneNumber,
                parentEmail: student.parentEmail || null,
                gender: student.gender,
                dob: student.dob ? moment(student.dob, "YYYY/MM/DD").toDate() : null,
                studentImgUrl: null,
                studentImgPublicId: null,
                schemeId: schemeMap.get(student.scheme),
                admissionYear: student.admissionYear,
                admissionType: student.admissionType,
                branchId: branchMap.get(student.branch)
            };
        });

        const createdStudents = await Student.bulkCreate(studentsToCreate, {
            transaction,
            individualHooks: true
        });

        await transaction.commit();
        transactionCommitted = true;
        cleanupFile();

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Successfully created ${createdStudents.length} students from CSV`,
                null
            )
        );

    } catch (error) {
        if (!transactionCommitted) {
            await transaction.rollback();
        }
        cleanupFile();
        throw error;
    }
});

const submitStudentBiometrics = asyncHandler(async (req, res) => {
    const imagePaths = getUploadedFilePaths(req.files);
    const {
        faceDescriptor
    } = req.body;
    const studentId = req.student.id;

    if (imagePaths.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "At least one biometric image is required");
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    const transaction = await sequelize.transaction();

    try {
        const oldKeys = student.faceImageKeys || [];

        const s3Keys = [];
        for (const imagePath of imagePaths) {
            const originalFilename = imagePath.split(/[\\\/]/).pop();
            const s3Key = `student/${studentId}/${randomUUID()}-${originalFilename}`;
            const uploadResult = await uploadToS3(imagePath, s3Key);
            s3Keys.push(uploadResult.key);
        }

        student.faceDescriptor = faceDescriptor;
        student.faceImageKeys = s3Keys;
        student.biometricVerificationStatus = 'Pending Review';
        await student.save({
            transaction
        });

        await transaction.commit();

        if (oldKeys.length > 0) {
            await deleteMultipleFromS3(oldKeys);
        }

        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Biometrics submitted successfully",
                null
            )
        );
    } catch (error) {
        await transaction.rollback();
        throw error;
    } finally {
        if (imagePaths.length > 0) {
            setImmediate(() => {
                for (const imagePath of imagePaths) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch {

                    }
                }
            });
        }
    }
});

const getStudentBiometrics = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.params;

    const student = await Student.findByPk(studentId, {
        attributes: ['id', 'biometricVerificationStatus', 'faceImageKeys']
    });

    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    let presignedUrls = student.faceImageKeys && student.faceImageKeys.length > 0 ?
        await getStudentPresignedUrls(student.faceImageKeys) : [];
    presignedUrls = presignedUrls.map((urlObj) => urlObj.url);

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Biometrics retrieved successfully", {
                biometricVerificationStatus: student.biometricVerificationStatus,
                presignedUrls
            }
        )
    );
});

const verifyStudentBiometrics = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (student.biometricVerificationStatus !== 'Pending Review') {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student biometrics are not pending review");
    }

    student.biometricVerificationStatus = 'Approved';
    await student.save();

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Biometrics verified successfully",
            null
        )
    );
});

const rejectStudentBiometrics = asyncHandler(async (req, res) => {
    const {
        studentId
    } = req.params;

    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    if (student.biometricVerificationStatus !== 'Pending Review' && student.biometricVerificationStatus !== 'Approved') {
        throw new ApiError(httpStatus.BAD_REQUEST, "Student biometrics cannot be rejected. Current status must be Pending Review or Approved");
    }
    await deleteMultipleFromS3(student.faceImageKeys);
    student.biometricVerificationStatus = 'Rejected';
    await student.save();

    res.status(httpStatus.OK).json(
        new ApiResponse(
            httpStatus.OK,
            "Biometrics rejected successfully",
            null
        )
    );
});

const enrollStudentFace = asyncHandler(async (req, res) => {
    const studentId = req.body?.studentId || req.params?.studentId || req.query?.studentId;
    const imagePaths = getUploadedFilePaths(req.files);

    if (!studentId) {
        throw new ApiError(httpStatus.BAD_REQUEST, "studentId is required");
    }

    if (imagePaths.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "At least one face image is required");
    }

    const student = await Student.findByPk(studentId);
    if (!student) {
        throw new ApiError(httpStatus.NOT_FOUND, "Student not found");
    }

    try {

        let totalDescriptor = new Array(128).fill(0);
        let validFacesCount = 0;

        for (const imagePath of imagePaths) {
            try {
                const descriptor = await generateSingleDescriptor(imagePath);

                if (descriptor && descriptor.length === 128) {
                    for (let i = 0; i < 128; i++) {
                        totalDescriptor[i] += descriptor[i];
                    }
                    validFacesCount++;
                }
            } catch (error) {
                console.warn(`Could not process face for image ${imagePath}:`, error.message);
            }
        }

        if (validFacesCount === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "No valid faces detected in any of the uploaded images. Please try again with clear photos.");
        }

        const finalFaceDescriptor = totalDescriptor.map((val) => val / validFacesCount);

        student.faceDescriptor = finalFaceDescriptor;
        await student.save();

        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Student face descriptor enrolled successfully",
                null
            )
        );

    } finally {

        if (imagePaths.length > 0) {
            setImmediate(() => {
                for (const imagePath of imagePaths) {
                    try {
                        fs.unlinkSync(imagePath);
                    } catch {

                    }
                }
            });
        }
    }
});

export {
    getStudents,
    addStudent,
    updateStudentDetails,
    updateStudentPassword,
    updateStudentImage,
    removeStudentImage,
    removeStudent,
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
    getStudentDetailsById,
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
};
