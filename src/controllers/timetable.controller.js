import Timetable from '../db/models/timetable.model.js';
import {
    ApiResponse
} from '../utils/ApiResponse.js';
import {
    ApiError
} from '../utils/ApiError.js';
import {
    asyncHandler
} from '../utils/asyncHandler.js';
import Division from '../db/models/division.model.js';
import {
    Op
} from 'sequelize';
import Branch from '../db/models/branch.model.js';
import Semester from '../db/models/semester.model.js';
import Scheme from '../db/models/scheme.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import httpStatus from 'http-status';

const getTimetables = asyncHandler(async (req, res) => {
    const {
        semesterNumber,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        page = 1,
        limit = 10
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let semesterFilterClause = {};
    let academicStartYearOfSemesterFilterClause = {};
    let academicEndYearOfSemesterFilterClause = {};

    if (semesterNumber) {
        semesterFilterClause.semesterNumber = Number(semesterNumber);
    }

    if (academicStartYearOfSemester) {
        academicStartYearOfSemesterFilterClause.academicStartYear = {
            [Op.gte]: academicStartYearOfSemester
        };
    }

    if (academicEndYearOfSemester) {
        academicEndYearOfSemesterFilterClause.academicEndYear = {
            [Op.lte]: academicEndYearOfSemester
        };
    }

    const timetables = await Timetable.findAndCountAll({
        include: [{
            model: Division,
            required: true,
            duplicating: false,
            include: [{
                model: Semester,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        semesterFilterClause,
                        academicStartYearOfSemesterFilterClause,
                        academicEndYearOfSemesterFilterClause
                    ]

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
                    }
                ]

            }]

        }],

        offset: offset,
        limit: parseInt(limit, 10)
    });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Timetables retrieved successfully.", {
        timetables: timetables.rows,
        totalCount: timetables.count
    }));
});

const getTimetableById = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const timetable = await Timetable.findOne({
        where: {
            id: id
        },
        include: [{
            model: Division,
            required: true,
            duplicating: false,
            include: [{
                model: Semester,
                required: true,
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

            }]

        }]

    });

    if (!timetable) throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");

    res.
    status(httpStatus.OK).
    json(
        new ApiResponse(
            httpStatus.OK,
            "Timetable fetched successfully",
            timetable
        )
    );
});

const getMyTimetables = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;

    if (!studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Student authentication required');
    }

    const studentDivisions = await StudentDivision.findAll({
        where: {
            studentId
        },
        attributes: ['divisionId'],
        raw: true
    });

    const divisionIds = [...new Set(studentDivisions.map((studentDivision) => studentDivision.divisionId))];

    if (divisionIds.length === 0) {
        return res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Timetables retrieved successfully.', {
            timetables: [],
            totalCount: 0
        }));
    }

    const timetables = await Timetable.findAndCountAll({
        where: {
            divisionId: {
                [Op.in]: divisionIds
            }
        },
        include: [{
            model: Division,
            required: true,
            duplicating: false,
            include: [{
                model: Semester,
                required: true,
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

            }]

        }],

        order: [
            ['updatedAt', 'DESC']
        ]
    });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Timetables retrieved successfully.', {
        timetables: timetables.rows,
        totalCount: timetables.count
    }));
});

const addTimetable = asyncHandler(async (req, res) => {
    const {
        divisionId,
        timetableVersion = 1
    } = req.body;

    const division = await Division.findByPk(divisionId);

    if (!division) {
        throw new ApiError(httpStatus.NOT_FOUND, "Division not found");
    }

    const timetable = await Timetable.create({
        divisionId: divisionId,
        timetableVersion: timetableVersion
    });

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Timetable added successfully", timetable));
});

const updateTimetable = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;
    const {
        timetableVersion
    } = req.body;

    const timetable = await Timetable.findByPk(id);

    if (!timetable) {
        throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");
    }

    if (timetable.timetableVersion >= timetableVersion) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Timetable version must be greater than current version");
    }

    timetable.timetableVersion = timetableVersion;

    await timetable.save();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Timetable updated successfully", timetable));
});

const removeTimetable = asyncHandler(async (req, res) => {
    const {
        id
    } = req.params;

    const timetable = await Timetable.findByPk(id);

    if (!timetable) {
        throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");
    }

    await timetable.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Timetable deleted successfully", null));
});

export {
    getTimetables,
    getTimetableById,
    getMyTimetables,
    addTimetable,
    updateTimetable,
    removeTimetable
};
