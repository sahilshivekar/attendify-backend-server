import Division from '../db/models/division.model.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';
import {
    ApiError
} from '../utils/ApiError.js';
import {
    asyncHandler
} from '../utils/asyncHandler.js';
import {
    Op
} from 'sequelize';
import Semester from '../db/models/semester.model.js';
import Branch from '../db/models/branch.model.js';
import Scheme from '../db/models/scheme.model.js';
import Batch from '../db/models/batch.model.js';
import Course from '../db/models/course.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import DivisionCourse from '../db/models/divisionCourse.model.js';
import httpStatus from 'http-status';

const getDivisions = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        branchId,
        semesterId,
        academicStartYear,
        academicEndYear,
        searchQuery,
        page = 1,
        limit = 10,
        getAll = false
    } = req.query;

    const searchClause = {};

    if (searchQuery) {
        searchClause.divisionCode = {
            [Op.iLike]: `%${searchQuery}%`
        };
    }

    const semesterWhereClause = {};

    if (semesterNumber) {
        semesterWhereClause.semesterNumber = {
            [Op.eq]: semesterNumber
        };
    }

    if (branchId) {
        semesterWhereClause.branchId = {
            [Op.eq]: branchId
        };
    }

    if (academicStartYear) {
        semesterWhereClause.academicStartYear = {
            [Op.gte]: academicStartYear
        };
    }

    if (academicEndYear) {
        semesterWhereClause.academicEndYear = {
            [Op.lte]: academicEndYear
        };
    }

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const divisions = await Division.findAndCountAll({
        where: {
            [Op.and]: [
                searchClause,
                ...(semesterId ? [{
                    semesterId
                }] : [])
            ]

        },
        include: [{
                model: Semester,
                required: true,
                where: semesterWhereClause,
                duplicating: false,
                include: [{
                        model: Branch,
                        required: true,
                        duplicating: false
                    },
                    {
                        model: Scheme,
                        required: true,
                        duplicating: false
                    }
                ]

            },
            {
                model: Batch
            }
        ],

        ...(limit ? {
            offset: offset
        } : {}),
        ...(limit && getAll === false ? {
            limit
        } : {})
    });
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Divisions fetched successfully", {
        divisions: divisions.rows,
        totalCount: divisions.count
    }));
});

const addDivision = asyncHandler(async (req, res) => {
    const {
        divisionCode,
        semesterId,
        optionalCourseIds
    } = req.body;

    const semester = await Semester.findByPk(semesterId);
    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Semester not found");
    }

    const existingDivision = await Division.findOne({
        where: {
            divisionCode: divisionCode,
            semesterId: semesterId
        }
    });
    if (existingDivision) {
        throw new ApiError(httpStatus.CONFLICT, "Duplicate Division Code in the same semester is not allowed");
    }

    const courses = await Course.findAll({
        where: {
            [Op.and]: [{
                    schemeId: semester.schemeId
                },
                {
                    optionalCourse: {
                        [Op.ne]: null
                    }
                }
            ]

        },
        include: [{
            model: BranchCourseSemester,
            required: true,
            where: {
                branchId: semester.branchId,
                semesterNumber: semester.semesterNumber
            },
            duplicating: false,
            include: {
                model: Branch,
                required: true,
                duplicating: false
            }
        }]

    });

    const requiredOptionalCourses = {};
    for (const course of courses) {
        if (requiredOptionalCourses[course.optionalCourse]) {
            requiredOptionalCourses[course.optionalCourse] = [...requiredOptionalCourses[course.optionalCourse], course.id];
        } else {
            requiredOptionalCourses[course.optionalCourse] = [course.id];
        }
    }

    const countOfRequiredOptionalCourses = Object.keys(requiredOptionalCourses).length;

    if (countOfRequiredOptionalCourses > 0) {
        if (!optionalCourseIds || optionalCourseIds.length !== countOfRequiredOptionalCourses) {
            throw new ApiError(httpStatus.BAD_REQUEST, `Please give ${countOfRequiredOptionalCourses} optional courses`);
        }

        for (let optionalCourseId of optionalCourseIds) {
            for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
                if (optionalCourseList.includes(optionalCourseId)) {
                    optionalCourseList.length = 0;
                    break;
                }
            }
        }

        for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
            if (optionalCourseList.length > 0) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Invalid optional courses`);
            }
        }
    }

    const division = await Division.create({
        divisionCode: divisionCode,
        semesterId: semesterId
    });

    if (!division) {
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Some issue occured while adding division");
    }

    if (optionalCourseIds && optionalCourseIds.length > 0) {
        for (let optionalCourseId of optionalCourseIds) {
            await DivisionCourse.create({
                divisionId: division.id,
                courseId: optionalCourseId
            });
        }
    }

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Division added successfully", division));
});

const updateDivision = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const {
        divisionCode,
        optionalCourseIds
    } = req.body;

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    if (divisionCode && divisionCode !== division.divisionCode) {
        const existingDivision = await Division.findOne({
            where: {
                divisionCode: divisionCode,
                semesterId: division.semesterId,
                id: {
                    [Op.ne]: id
                }
            }
        });
        if (existingDivision) {
            throw new ApiError(httpStatus.CONFLICT, "Duplicate Division Code in the same semester is not allowed");
        }
    }

    division.divisionCode = divisionCode;
    await division.save();

    if (optionalCourseIds !== undefined) {
        const semester = await Semester.findByPk(division.semesterId);
        if (!semester) {
            throw new ApiError(httpStatus.NOT_FOUND, "Associated semester not found");
        }

        const courses = await Course.findAll({
            where: {
                [Op.and]: [{
                        schemeId: semester.schemeId
                    },
                    {
                        optionalCourse: {
                            [Op.ne]: null
                        }
                    }
                ]

            },
            include: [{
                model: BranchCourseSemester,
                required: true,
                where: {
                    branchId: semester.branchId,
                    semesterNumber: semester.semesterNumber
                },
                duplicating: false
            }]

        });

        const requiredOptionalCourses = {};
        for (const course of courses) {
            if (requiredOptionalCourses[course.optionalCourse]) {
                requiredOptionalCourses[course.optionalCourse] = [...requiredOptionalCourses[course.optionalCourse], course.id];
            } else {
                requiredOptionalCourses[course.optionalCourse] = [course.id];
            }
        }

        const countOfRequiredOptionalCourses = Object.keys(requiredOptionalCourses).length;

        if (countOfRequiredOptionalCourses > 0) {
            if (optionalCourseIds.length !== countOfRequiredOptionalCourses) {
                throw new ApiError(httpStatus.BAD_REQUEST, `Please give ${countOfRequiredOptionalCourses} optional courses`);
            }

            for (let optionalCourseId of optionalCourseIds) {
                for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
                    if (optionalCourseList.includes(optionalCourseId)) {
                        optionalCourseList.length = 0;
                        break;
                    }
                }
            }

            for (let optionalCourseList of Object.values(requiredOptionalCourses)) {
                if (optionalCourseList.length > 0) {
                    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid optional courses`);
                }
            }
        }

        const existingOptionalCourses = await DivisionCourse.findAll({
            where: {
                divisionId: id
            },
            attributes: ['courseId']
        });
        const existingCourseIds = existingOptionalCourses.map((dc) => dc.courseId);

        const newCourseIds = optionalCourseIds;
        const arraysEqual = (a, b) => a.length === b.length && a.every((val, index) => val === b[index]);
        const hasChanged = !arraysEqual(existingCourseIds.sort(), newCourseIds.sort());

        if (hasChanged) {
            const toAdd = newCourseIds.filter((id) => !existingCourseIds.includes(id));
            const toRemove = existingCourseIds.filter((id) => !newCourseIds.includes(id));

            if (toRemove.length > 0) {
                await DivisionCourse.destroy({
                    where: {
                        divisionId: id,
                        courseId: toRemove
                    }
                });
            }

            for (let courseId of toAdd) {
                await DivisionCourse.create({
                    divisionId: id,
                    courseId: courseId
                });
            }
        }
    }

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Division updated successfully", division));
});

const removeDivision = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const division = await Division.findByPk(id);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    await division.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Division deleted successfully", null));
});

const getDivisionById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const division = await Division.findOne({
        where: {
            id: id
        },
        include: [{
                model: Semester,
                required: true,
                include: [{
                        model: Branch,
                        required: true
                    },
                    {
                        model: Scheme,
                        required: true
                    }
                ]

            },
            {
                model: Batch
            }
        ]

    });

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Division retrieved successfully",
            division
        )
    );
});

const getCoursesOfDivision = asyncHandler(async (req, res) => {
    const {
        divisionId
    } = req.query;

    const division = await Division.findByPk(divisionId);
    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    const semester = await Semester.findByPk(division.semesterId);
    if (!semester) {
        throw new ApiError(httpStatus.NOT_FOUND, "Associated semester not found");
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

            }
        }
    });

    const optionalCourses = await DivisionCourse.findAll({
        where: {
            divisionId: divisionId
        },
        include: {
            model: Course,
            required: true
        }
    });

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Division courses retrieved successfully.", {
                compulsoryCourses: compulsaryCourses.map((bcs) => bcs.Course),
                optionalCourses: optionalCourses
            }
        )
    );
});

export {
    getDivisions,
    addDivision,
    updateDivision,
    removeDivision,
    getDivisionById,
    getCoursesOfDivision
};
