import Teacher from '../db/models/teacher.model.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js'
import { ApiError } from '../utils/ApiError.js'
import { Op } from 'sequelize'
import Sequelize from 'sequelize';
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';
import fs from "fs"
import csvParser from 'csv-parser';
import Course from '../db/models/course.model.js';
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import Scheme from '../db/models/scheme.model.js';
import httpStatus from 'http-status';
import sequelize from '../config/db.connection.js';
import teacherValidation from '../validators/teacher.validation.js';

// All input validation is now handled in @teacher.validation.js

const options = {
    httpOnly: true,
    secure: true,
};

const generateAccessAndRefreshTokens = async (teacher) => {
    try {
        const newAccessToken = await teacher.generateAccessToken();
        const newRefreshToken = await teacher.generateRefreshToken();

        return { newAccessToken, newRefreshToken };
    } catch (err) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Something went wrong while generating tokens");
    }
};

//* get all the teacher
const getTeacher = asyncHandler(async (req, res) => {

    const {
        searchQuery,
        courseId,
        page = 1,
        limit = 10,
        getAll = "false",
    } = req.query;

    // Normalize getAll to a boolean regardless of it coming as string or boolean
    const isGetAll = getAll === true || getAll === 'true';

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let searchClause = {};

    const normalizedSearch = searchQuery.trim().replace(/\s+/g, " ");
    const terms = normalizedSearch.split(" ");

    searchClause = {
        [Op.and]: terms.map(term => ({
            [Op.or]: [
                { firstName: { [Op.iLike]: `%${term}%` } },
                { middleName: { [Op.iLike]: `%${term}%` } },
                { lastName: { [Op.iLike]: `%${term}%` } },
                { email: { [Op.iLike]: `%${term}%` } },
                { phoneNumber: { [Op.iLike]: `%${term}%` } },
                { highestQualification: { [Op.iLike]: `%${term}%` } },
            ],
        })),
    };

    let courseIdFilterClause = {}
    let includeClause = []

    if (courseId) {
        courseIdFilterClause.courseId = courseId
        includeClause.push(
            {
                model: TeacherTeachesCourse,
                required: true,
                where: courseIdFilterClause,
                duplicating: false,
                include: [
                    {
                        model: Course,
                        required: true,
                        duplicating: false,
                    }
                ]
            }
        )
    }

    const teacher = await Teacher.findAndCountAll({
        where: searchClause,
        include: includeClause,
        order: [['firstName', 'ASC']],
        ...(limit && !isGetAll ? { offset: offset, } : {}),
        ...(limit && !isGetAll ? { limit: parseInt(limit, 10) } : {}),
        distinct: true,
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teachers retrieved successfully.",
                {
                    teacher: teacher.rows,
                    totalTeacher: teacher.count
                }
            )
        );

});

const getTeacherById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher fetched successfully",
                teacher
            )
        );
});

//* add teacher
const addTeacher = asyncHandler(async (req, res) => {

    const {
        firstName,
        middleName,
        lastName,
        email,
        phoneNumber,
        gender,
        highestQualification,
        role,
        // password,
        // confirmPassword,
        isActive
    } = req.body;

    const teacherImageLocalPath = req.file?.path

    // All input validation is now handled in @teacher.validation.js

    const existingTeacherMember = await Teacher.findOne({ where: { email } })

    if (existingTeacherMember) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(httpStatus.BAD_REQUEST, "A teacher member with this email already exists")
    }

    let teacherImageUrl = null;
    let teacherImagePublicId = null;

    if (teacherImageLocalPath) {

        const teacherImage = await uploadOnCloudinary(teacherImageLocalPath)

        if (!teacherImage?.url) {
            fs.unlinkSync(teacherImageLocalPath)
            throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while uploading the image")
        }

        teacherImageUrl = teacherImage.secure_url
        teacherImagePublicId = teacherImage.public_id
    }

    const addedTeacherMember = await Teacher.create({
        firstName: firstName,
        middleName: middleName || null,
        lastName: lastName,
        teacherImageUrl: teacherImageUrl,
        teacherImagePublicId: teacherImagePublicId,
        email: email,
        phoneNumber: phoneNumber,
        gender: gender,
        highestQualification: highestQualification || null,
        role: role,
        // password: password,
        isActive: isActive || true
    });


    if (!addedTeacherMember) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while adding teacher member")
    }

    res
        .status(httpStatus.CREATED)
        .json(
            new ApiResponse(
                httpStatus.CREATED,
                'Teacher member added successfully',
                addedTeacherMember
            )
        )

});

const updateTeacherDetails = asyncHandler(async (req, res) => {
    const {
        id,
        firstName,
        middleName,
        lastName,
        email,
        role,
        gender,
        highestQualification,
        phoneNumber,
        isActive
    } = req.body;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    teacher.firstName = firstName || teacher.firstName;
    teacher.middleName = middleName || teacher.middleName;
    teacher.lastName = lastName || teacher.lastName;
    teacher.email = email || teacher.email;
    teacher.role = role || teacher.role;
    teacher.gender = gender || teacher.gender;
    teacher.highestQualification = highestQualification || teacher.highestQualification;
    teacher.phoneNumber = phoneNumber || teacher.phoneNumber;
    teacher.isActive = isActive || teacher.isActive;

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher updated successfully",
                teacher
            )
        );
})

const updateTeacherPassword = asyncHandler(async (req, res) => {
    const {
        id,
        password,
        confirmPassword
    } = req.body;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    teacher.password = password || '';

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher password updated successfully",
                teacher
            )
        );
})


const updateTeacherImage = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const teacherImageLocalPath = req.file?.path

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        if (teacherImageLocalPath) {
            fs.unlinkSync(teacherImageLocalPath)
        }
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    if (!teacherImageLocalPath) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Teacher image file is required")
    }

    const uploadedImageResponse = await uploadOnCloudinary(teacherImageLocalPath)

    if (!uploadedImageResponse?.url) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while uploading the image")
    }

    teacher.teacherImageUrl = uploadedImageResponse.secure_url
    teacher.teacherImagePublicId = uploadedImageResponse.public_id

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher image updated successfully",
                teacher
            )
        );
})

const removeImage = asyncHandler(async (req, res) => {
    const { id } = req.query;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found")
    }

    const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)

    if (!deletedImage) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while deleting the image")
    }

    teacher.teacherImageUrl = null;
    teacher.teacherImagePublicId = null;

    await teacher.save();

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teacher image deleted successfully",
                teacher
            )
        );
})

//* remove teacher
const removeTeacher = asyncHandler(async (req, res) => {

    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const transaction = await sequelize.transaction();
    try {
        // Handle image deletion outside transaction (external service)
        if (teacher.teacherImagePublicId) {
            const deletedImage = await deleteFromCloudinary(teacher.teacherImagePublicId)
            if (!deletedImage) {
                await transaction.rollback();
                throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while deleting the image")
            }
        }

        await teacher.destroy({ transaction });
        await transaction.commit();

        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    "Teacher deleted successfully",
                    null
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//! logout is remaining

const addTeachingCourse = asyncHandler(async (req, res) => {
    const { teacherId, courseId } = req.body;

    const transaction = await sequelize.transaction();
    try {
        const teacher = await Teacher.findByPk(teacherId, { transaction });
        if (!teacher) {
            throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
        }
        const course = await Course.findByPk(courseId, { transaction });
        if (!course) {
            throw new ApiError(httpStatus.NOT_FOUND, "Course not found");
        }
        const alreadyAssigned = await TeacherTeachesCourse.findOne({
            where: {
                teacherId: teacherId,
                courseId: courseId,
            },
            transaction
        });
        if (alreadyAssigned) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Course is already assigned to this teacher member")
        }
        const teacherTeachesCourseEntry = await TeacherTeachesCourse.create({
            teacherId: teacherId,
            courseId: courseId,
        }, { transaction });
        await transaction.commit();
        res
            .status(httpStatus.CREATED)
            .json(
                new ApiResponse(
                    httpStatus.CREATED,
                    "Teaching course added successfully",
                    teacherTeachesCourseEntry
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});


const removeTeachingCourse = asyncHandler(async (req, res) => {
    const { teacherTeachesCourseId } = req.params;

    const transaction = await sequelize.transaction();
    try {
        const teacherCourse = await TeacherTeachesCourse.findByPk(teacherTeachesCourseId, {
            transaction
        });
        if (!teacherCourse) {
            throw new ApiError(httpStatus.NOT_FOUND, "Teacher course not found");
        }
        await teacherCourse.destroy({ transaction });
        await transaction.commit();
        res
            .status(httpStatus.OK)
            .json(
                new ApiResponse(
                    httpStatus.OK,
                    "Teaching course deleted successfully",
                    null
                )
            );
    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const getTeachingCourses = asyncHandler(async (req, res) => {
    const { teacherId } = req.query;

    // Validation moved to @teacher.validation.js

    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const teachingCourses = await TeacherTeachesCourse.findAll({
        where: {
            teacherId: teacherId
        },
        include: [
            {
                model: Course,
                required: true,
                include: [
                    {
                        model: Scheme,
                        required: true,
                    }
                ]
            }
        ]
    });

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Teaching courses retrieved successfully",
                teachingCourses
            )
        );
});


//* Bulk Create Teachers
const bulkCreateTeachers = asyncHandler(async (req, res) => {
    const { teachers } = req.body;

    if (!teachers || !Array.isArray(teachers) || teachers.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Teachers array is required and must not be empty");
    }



    const transaction = await sequelize.transaction();
    try {
        const createdTeachers = [];
        const errors = [];

        for (let i = 0; i < teachers.length; i++) {
            const teacherData = teachers[i];
            try {
                // Validate required fields
                if (!teacherData.firstName || !teacherData.lastName ||
                    !teacherData.email || !teacherData.phoneNumber ||
                    !teacherData.gender || !teacherData.role) {
                    errors.push({ index: i, error: "Missing required fields" });
                    continue;
                }

                // Check if email already exists
                const existingTeacher = await Teacher.findOne({
                    where: { email: teacherData.email },
                    transaction
                });

                if (existingTeacher) {
                    errors.push({ index: i, error: `Email ${teacherData.email} already exists` });
                    continue;
                }

                const teacher = await Teacher.create({
                    firstName: teacherData.firstName,
                    middleName: teacherData.middleName || null,
                    lastName: teacherData.lastName,
                    email: teacherData.email,
                    phoneNumber: teacherData.phoneNumber,
                    gender: teacherData.gender,
                    highestQualification: teacherData.highestQualification || null,
                    role: teacherData.role,
                    isActive: teacherData.isActive !== undefined ? teacherData.isActive : true
                }, { transaction });

                createdTeachers.push(teacher);

            } catch (error) {
                errors.push({ index: i, error: error.message });
            }
        }

        await transaction.commit();



        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Bulk teacher creation completed. Created: ${createdTeachers.length}, Errors: ${errors.length}`,
                {
                    createdTeachers,
                    errors,
                    summary: {
                        total: teachers.length,
                        created: createdTeachers.length,
                        failed: errors.length
                    }
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Bulk teacher creation failed");
    }
});

//* Bulk Delete Teachers
const bulkDeleteTeachers = asyncHandler(async (req, res) => {
    const { teacherIds } = req.body;

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Teacher IDs array is required and must not be empty");
    }



    const transaction = await sequelize.transaction();
    try {
        const teachers = await Teacher.findAll({
            where: { id: { [Op.in]: teacherIds } },
            transaction
        });

        if (teachers.length === 0) {
            throw new ApiError(httpStatus.NOT_FOUND, "No teachers found with provided IDs");
        }

        // Delete images from cloudinary for teachers that have them
        const teachersWithImages = teachers.filter(teacher => teacher.teacherImagePublicId);
        for (const teacher of teachersWithImages) {
            try {
                await deleteFromCloudinary(teacher.teacherImagePublicId);
            } catch (error) {

            }
        }

        const deletedCount = await Teacher.destroy({
            where: { id: { [Op.in]: teacherIds } },
            transaction
        });

        await transaction.commit();



        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Teachers deleted successfully",
                {
                    deletedCount,
                    requestedCount: teacherIds.length
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

//* Bulk Create Teachers from CSV
const bulkCreateTeachersFromCSV = asyncHandler(async (req, res) => {
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
            fs.createReadStream(csvFilePath)
                .pipe(csvParser())
                .on('data', (row) => rows.push(row))
                .on('end', () => resolve(rows))
                .on('error', (err) => reject(err));
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

    const validationErrors = [];
    const validatedTeachers = [];

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNumber = i + 2; // header is row 1

        const { error, value } = teacherValidation.csvTeacherRowSchema.validate(row, { abortEarly: false });
        if (error) {
            const errorMessages = error.details.map(d => d.message).join('; ');
            validationErrors.push({ row: rowNumber, email: row.email || 'N/A', errors: errorMessages });
        } else {
            validatedTeachers.push({ ...value, rowNumber });
        }
    }

    if (validationErrors.length > 0) {
        cleanupFile();
        throw new ApiError(
            httpStatus.BAD_REQUEST,
            `Validation failed for ${validationErrors.length} row(s). No teachers were added.`,
            validationErrors
        );
    }

    const transaction = await sequelize.transaction();
    let committed = false;
    try {
        const emails = validatedTeachers.map(t => t.email.toLowerCase());
        const phoneNumbers = validatedTeachers.map(t => t.phoneNumber);

        // Duplicate emails within CSV
        const emailSet = new Set();
        const duplicateEmails = [];
        for (const t of validatedTeachers) {
            const e = t.email.toLowerCase();
            if (emailSet.has(e)) duplicateEmails.push({ row: t.rowNumber, email: t.email });
            emailSet.add(e);
        }
        if (duplicateEmails.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Duplicate emails found within CSV file', duplicateEmails);
        }

        // Duplicate phones within CSV
        const phoneSet = new Set();
        const duplicatePhones = [];
        for (const t of validatedTeachers) {
            const p = t.phoneNumber;
            if (phoneSet.has(p)) duplicatePhones.push({ row: t.rowNumber, phoneNumber: p });
            phoneSet.add(p);
        }
        if (duplicatePhones.length > 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, 'Duplicate phone numbers found within CSV file', duplicatePhones);
        }

        // Existing emails in DB
        const existingByEmail = await Teacher.findAll({ where: { email: { [Op.in]: emails } }, transaction });
        if (existingByEmail.length > 0) {
            const existingEmails = existingByEmail.map(t => t.email);
            throw new ApiError(httpStatus.BAD_REQUEST, `The following emails already exist in the database: ${existingEmails.join(', ')}`);
        }

        // Existing phones in DB
        const existingByPhone = await Teacher.findAll({ where: { phoneNumber: { [Op.in]: phoneNumbers } }, transaction });
        if (existingByPhone.length > 0) {
            const existingPhones = existingByPhone.map(t => t.phoneNumber);
            throw new ApiError(httpStatus.BAD_REQUEST, `The following phone numbers already exist in the database: ${existingPhones.join(', ')}`);
        }

        const toCreate = validatedTeachers.map(t => ({
            firstName: t.firstName,
            middleName: t.middleName || null,
            lastName: t.lastName,
            email: t.email.toLowerCase(),
            phoneNumber: t.phoneNumber,
            gender: t.gender,
            highestQualification: t.highestQualification || null,
            role: t.role,
            isActive: t.isActive !== undefined ? t.isActive : true
        }));

        const created = await Teacher.bulkCreate(toCreate, {
            transaction,
            individualHooks: true,
            returning: true
        });

        await transaction.commit();
        committed = true;
        cleanupFile();
        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                `Successfully created ${created.length} teachers from CSV`,
                null
            )
        );
    } catch (error) {
        if (!committed) await transaction.rollback();
        cleanupFile();
        throw error;
    }
});


export {
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
}