import Semester from '../../db/models/semester.model.js';
import {
    asyncHandler
} from '../../utils/asyncHandler.js';
import {
    ApiResponse
} from '../../utils/ApiResponse.js';
import {
    ApiError
} from '../../utils/ApiError.js';
import {
    Op,
    where
} from 'sequelize';
import Branch from '../../db/models/branch.model.js';
import Scheme from '../../db/models/scheme.model.js';
import Course from '../../db/models/course.model.js';
import BranchCourseSemester from '../../db/models/branchCourseSemester.model.js';
import University from '../../db/models/university.model.js';
import DivisionCourse from '../../db/models/divisionCourse.model.js';
import Division from '../../db/models/division.model.js';
import Batch from '../../db/models/batch.model.js';
import httpStatus from 'http-status';
import sequelize from '../../config/db.connection.js';

const getSemesters = asyncHandler(async (req, res) => {

    const {
        semesterNumber,
        academicStartYear,
        academicEndYear,
        branchId,
        schemeId,
        page = 1,
        limit = 10,
        getAll = false,
        isEven = true,
        isOdd = true
    } = req.query;

    const whereClause = {};
    if (semesterNumber) {
        whereClause.semesterNumber = {
            [Op.eq]: parseInt(semesterNumber)
        };
    }

    if (academicStartYear) {
        whereClause.academicStartYear = {
            [Op.gte]: parseInt(academicStartYear)
        };
    }

    if (academicEndYear) {
        whereClause.academicEndYear = {
            [Op.lte]: parseInt(academicEndYear)
        };
    }

    if (branchId) {
        whereClause.branchId = {
            [Op.eq]: branchId
        };
    }

    if (schemeId) {
        whereClause.schemeId = {
            [Op.eq]: schemeId
        };
    }

    if (isEven && !isOdd) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push(sequelize.literal('semester_number % 2 = 0'));
    }

    if (isOdd && !isEven) {
        whereClause[Op.and] = whereClause[Op.and] || [];
        whereClause[Op.and].push(sequelize.literal('semester_number % 2 = 1'));
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const semesters = await Semester.findAndCountAll({
        where: whereClause,
        include: [{
                model: Branch,
                required: true,
                duplicating: false
            },
            {
                model: Scheme,
                required: true,
                duplicating: false
            },
            {
                model: Division,
                duplicating: false,
                separate: true,
                include: [{
                    model: Batch,
                    duplicating: false,
                    separate: true
                }]

            }
        ],

        ...(limit && getAll === false ? {
            offset: offset
        } : {}),
        ...(limit && getAll === false ? {
            limit
        } : {})
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Semesters retrieved successfully.", {
                semesters: semesters.rows,
                totalCount: semesters.count
            }
        )
    );
});

const addSemester = asyncHandler(async (req, res) => {

    const {
        branchId,
        semesterNumber,
        academicStartYear,
        academicEndYear,
        startDate,
        endDate,
        schemeId
    } = req.body;

    if (academicEndYear < academicStartYear) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Academic end year cannot be less than academic start year");
    }

    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (startDateObj >= endDateObj) {
        throw new ApiError(httpStatus.BAD_REQUEST, "End date cannot be less than or equal to start date");
    }

    if (startDateObj.getFullYear() < Number(academicStartYear)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Start date cannot be lesser than academic start year");
    }

    if (endDateObj.getFullYear() > Number(academicEndYear)) {
        throw new ApiError(httpStatus.BAD_REQUEST, "End date cannot be greater than academic end year");
    }

    const semester = await Semester.create({
        branchId: branchId || null,
        semesterNumber: semesterNumber || null,
        academicStartYear: academicStartYear || null,
        academicEndYear: academicEndYear || null,
        schemeId: schemeId || null,
        startDate: startDate || null,
        endDate: endDate || null
    });

    res.
    status(httpStatus.CREATED).
    json(
        new ApiResponse(
            httpStatus.CREATED,
            'Semester added successfully',
            semester
        )
    );

});

const getCoursesOfSemester = asyncHandler(async (req, res) => {
    const {
        semesterId
    } = req.query;

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    const compulsaryCourses = await BranchCourseSemester.findAll({
        where: {
            branchId: semester.branchId,
            semesterNumber: semester.semesterNumber
        },
        include: {
            model: Course,
            required: true,
            where: {
                [Op.and]: [{
                    schemeId: semester.schemeId,
                    optionalCourse: null
                }]

            },
            include: {
                model: Scheme,
                required: true
            }

        }
    });

    const divisions = await Division.findAll({
        where: {
            semesterId: semesterId
        },
        attributes: ['id']
    });

    const divisionIds = divisions.map((div) => div.id);

    const optionalCourses = divisionIds.length > 0 ? await DivisionCourse.findAll({
        where: {
            divisionId: {
                [Op.in]: divisionIds
            }
        },
        include: [{
                model: Course,
                required: true
            },
            {
                model: Division,
                required: true
            }
        ]

    }) : [];

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Courses retrieved successfully.", {
                compulsoryCourses: compulsaryCourses.map((bcs) => bcs.Course),
                optionalCourses: optionalCourses
            }
        )
    );
});

const updateSemester = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const {
        startDate,
        endDate
    } = req.body;

    const semester = await Semester.findByPk(id);

    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    if (startDate || endDate) {
        const startDateObj = new Date(startDate || semester.startDate);
        const endDateObj = new Date(endDate || semester.endDate);

        if (startDateObj >= endDateObj) {
            throw new ApiError(httpStatus.BAD_REQUEST, "End date cannot be less than or equal to start date");
        }

        if (startDateObj.getFullYear() < semester.academicStartYear) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Start date cannot be lesser than academic start year");
        }

        if (endDateObj.getFullYear() > semester.academicEndYear) {
            throw new ApiError(httpStatus.BAD_REQUEST, "End date cannot be greater than academic end year");
        }

        semester.endDate = endDate || semester.endDate;
        semester.startDate = startDate || semester.startDate;
    }

    await semester.save();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Semester updated successfully",
            semester
        )
    );
});

const removeSemester = asyncHandler(async (req, res) => {

    const {
        id
    } = req.params;

    const semester = await Semester.findByPk(id);

    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    await semester.destroy();

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Semester deleted successfully",
            null
        )
    );
});

const getSemesterById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const semester = await Semester.findOne({
        where: {
            id: id
        },
        include: [{
                model: Branch,
                required: true,
                duplicating: false
            },
            {
                model: Scheme,
                required: true,
                duplicating: false
            },
            {
                model: Division,
                duplicating: false,
                include: [{
                    model: Batch,
                    duplicating: false
                }]

            }
        ]

    });

    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Semester retrieved successfully",
            semester
        )
    );
});

const bulkCreateSemesters = asyncHandler(async (req, res) => {
    const {
        semesters
    } = req.body;

    const transaction = await sequelize.transaction();

    try {

        const branchIds = [...new Set(semesters.map((semester) => semester.branchId))];
        const existingBranches = await Branch.findAll({
            where: {
                id: branchIds
            },
            attributes: ['id'],
            transaction
        });

        const existingBranchIds = existingBranches.map((branch) => branch.id);
        const invalidBranchIds = branchIds.filter((id) => !existingBranchIds.includes(id));

        if (invalidBranchIds.length > 0) {
            await transaction.rollback();
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid branch IDs: ${invalidBranchIds.join(', ')}`
            );
        }

        const schemeIds = [...new Set(semesters.map((semester) => semester.schemeId))];
        const existingSchemes = await Scheme.findAll({
            where: {
                id: schemeIds
            },
            attributes: ['id'],
            transaction
        });

        const existingSchemeIds = existingSchemes.map((scheme) => scheme.id);
        const invalidSchemeIds = schemeIds.filter((id) => !existingSchemeIds.includes(id));

        if (invalidSchemeIds.length > 0) {
            await transaction.rollback();
            throw new ApiError(
                httpStatus.BAD_REQUEST,
                `Invalid scheme IDs: ${invalidSchemeIds.join(', ')}`
            );
        }

        for (const semester of semesters) {
            if (semester.academicEndYear < semester.academicStartYear) {
                await transaction.rollback();
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    "Academic end year cannot be less than academic start year"
                );
            }

            const startDateObj = new Date(semester.startDate);
            const endDateObj = new Date(semester.endDate);

            if (startDateObj >= endDateObj) {
                await transaction.rollback();
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    "End date cannot be less than or equal to start date"
                );
            }

            if (startDateObj.getFullYear() < semester.academicStartYear) {
                await transaction.rollback();
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    "Start date cannot be lesser than academic start year"
                );
            }

            if (endDateObj.getFullYear() > semester.academicEndYear) {
                await transaction.rollback();
                throw new ApiError(
                    httpStatus.BAD_REQUEST,
                    "End date cannot be greater than academic end year"
                );
            }
        }

        const duplicateCheck = await Promise.all(
            semesters.map(async (semester) => {
                const existing = await Semester.findOne({
                    where: {
                        branchId: semester.branchId,
                        semesterNumber: semester.semesterNumber,
                        academicStartYear: semester.academicStartYear,
                        academicEndYear: semester.academicEndYear,
                        schemeId: semester.schemeId
                    },
                    transaction
                });
                return existing ? semester : null;
            })
        );

        const duplicates = duplicateCheck.filter(Boolean);
        if (duplicates.length > 0) {
            await transaction.rollback();
            throw new ApiError(
                httpStatus.CONFLICT,
                `Duplicate semesters found`
            );
        }

        const createdSemesters = await Semester.bulkCreate(semesters, {
            transaction,
            validate: true,
            returning: true
        });

        await transaction.commit();

        res.
        status(httpStatus.CREATED).
        json(
            new ApiResponse(
                httpStatus.CREATED,
                `${createdSemesters.length} semesters created successfully`, {
                    semesters: createdSemesters
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
});

const bulkDeleteSemesters = asyncHandler(async (req, res) => {
    const {
        semesterIds
    } = req.body;

    const uniqueSemesterIds = [...new Set(semesterIds)];

    const transaction = await sequelize.transaction();

    try {

        const existingSemesters = await Semester.findAll({
            where: {
                id: uniqueSemesterIds
            },
            attributes: ['id'],
            transaction
        });

        if (existingSemesters.length !== uniqueSemesterIds.length) {
            const existingIds = existingSemesters.map((semester) => semester.id);
            const nonExistentIds = uniqueSemesterIds.filter((id) => !existingIds.includes(id));

            throw new ApiError(
                httpStatus.NOT_FOUND,
                `Some semesters not found: ${nonExistentIds.join(', ')}`
            );
        }

        const Division = (await import('../../db/models/division.model.js')).default;
        const StudentSemester = (await import('../../db/models/studentSemester.model.js')).default;

        const associatedDivisions = await Division.findAll({
            where: {
                semesterId: uniqueSemesterIds
            },
            attributes: ['semesterId'],
            transaction
        });

        if (associatedDivisions.length > 0) {
            const associatedSemesterIds = [...new Set(associatedDivisions.map((div) => div.semesterId))];

            throw new ApiError(
                httpStatus.CONFLICT,
                `Cannot delete semester: dependent records exist (divisions: ${associatedSemesterIds.join(', ')})`
            );
        }

        const associatedStudents = await StudentSemester.findAll({
            where: {
                semesterId: uniqueSemesterIds
            },
            attributes: ['semesterId'],
            transaction
        });

        if (associatedStudents.length > 0) {
            const associatedSemesterIds = [...new Set(associatedStudents.map((ss) => ss.semesterId))];

            throw new ApiError(
                httpStatus.CONFLICT,
                `Cannot delete semester: dependent records exist (student enrollments: ${associatedSemesterIds.join(', ')})`
            );
        }

        const deletedCount = await Semester.destroy({
            where: {
                id: uniqueSemesterIds
            },
            transaction
        });

        await transaction.commit();

        res.
        status(httpStatus.OK).
        json(
            new ApiResponse(
                httpStatus.OK,
                `${deletedCount} semesters deleted successfully`, {
                    deletedCount
                }
            )
        );

    } catch (error) {
        try {
            await transaction.rollback();
        } catch (rollbackErr) {

        }
        throw error;
    }
});

export {
    getSemesters,
    addSemester,
    updateSemester,
    removeSemester,
    getCoursesOfSemester,
    getSemesterById,
    bulkCreateSemesters,
    bulkDeleteSemesters
};
