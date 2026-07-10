import { Op } from 'sequelize';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import Class from '../db/models/class.model.js';
import Room from '../db/models/room.model.js';
import Course from '../db/models/course.model.js';
import Teacher from '../db/models/teacher.model.js';
import Batch from '../db/models/batch.model.js';
import Timetable from '../db/models/timetable.model.js';
import Division from '../db/models/division.model.js';
import Semester from '../db/models/semester.model.js';
import BranchCourseSemester from '../db/models/branchCourseSemester.model.js';
import Branch from '../db/models/branch.model.js';
import CancelledClass from '../db/models/cancelledClass.model.js';
import StudentDivision from '../db/models/studentDivision.model.js';
import { sendNotification } from '../utils/firebaseCloudMessaging.js';
import StudentFCMToken from '../db/models/studentFCMToken.model.js';
import { getTimeInTwelveHourFormat } from '../utils/time.js';
import { fromYYYYMMDDToDDMMYYYY } from '../utils/date.js';
import { fromYYYYMMDDToDDMMYYYY as formatDateReadable } from '../utils/date.js';
import StudentBatch from '../db/models/studentBatch.model.js';
import TeacherTeachesCourse from '../db/models/teacherTeachesCourse.model.js';
import httpStatus from 'http-status';
import { getDateStringFromObj } from '../utils/date.js';
import sequelize from '../config/db.connection.js';
import fs from 'fs';
import csv from 'csv-parser';

const getYearFromSemesterNumber = (semesterNumber) => {
    if (semesterNumber === 1 || semesterNumber === 2) return 'FE'
    else if (semesterNumber === 3 || semesterNumber === 4) return 'SE'
    else if (semesterNumber === 5 || semesterNumber === 6) return 'TE'
    else if (semesterNumber === 7 || semesterNumber === 8) return 'BE'
    return "Invalid semester number"
}

const WEEK_DAY_TO_INDEX = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6
};

const parseDateOnly = (dateString) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
};

const getNextOccurrenceDate = ({
    classDayOfWeek,
    classStartTime,
    activeFrom,
    activeTill,
    todayDate,
    currentTime
}) => {
    const targetDayIndex = WEEK_DAY_TO_INDEX[classDayOfWeek];
    if (targetDayIndex === undefined) {
        return null;
    }

    const firstSearchDate = activeFrom > todayDate ? activeFrom : todayDate;
    const baseDate = parseDateOnly(firstSearchDate);

    const dayGap = (targetDayIndex - baseDate.getDay() + 7) % 7;
    baseDate.setDate(baseDate.getDate() + dayGap);

    const nextOccurrenceDate = getDateStringFromObj(baseDate);

    if (nextOccurrenceDate === todayDate && classStartTime < currentTime) {
        baseDate.setDate(baseDate.getDate() + 7);
    }

    const adjustedOccurrenceDate = getDateStringFromObj(baseDate);

    if (adjustedOccurrenceDate > activeTill) {
        return null;
    }

    return adjustedOccurrenceDate;
};

const getThrowableConflictMessage = async (conflictType, conflictName) => {
    const conflitCourse = await Course.findByPk(conflictType.courseId)
    const conflictTimeTable = await Timetable.findByPk(conflictType.timetableId)
    const conflictTeacher = await Teacher.findByPk(conflictType.teacherId)

    let conflictBatch = null;
    if (conflictType.batchId != null) {
        conflictBatch = await Batch.findByPk(conflictType.batchId)
    }

    const conflictDivision = await Division.findByPk(conflictTimeTable.divisionId)
    const conflictSemester = await Semester.findByPk(conflictDivision.semesterId)
    const conflictRoom = await Room.findByPk(conflictType.roomId)

    return `${conflictName} Prof. ${conflictTeacher.firstName} ${conflictTeacher.lastName} is already taking class of '${conflitCourse.name}' on ${getYearFromSemesterNumber(conflictSemester.semesterNumber)} ${conflictBatch == null ? "Division" : "Batch"} ${conflictBatch == null ? conflictDivision.divisionCode : conflictBatch.batchCode} in room ${conflictRoom.roomNumber} between ${getTimeInTwelveHourFormat(conflictType.startTime)} - ${getTimeInTwelveHourFormat(conflictType.endTime)} on ${conflictType.dayOfWeek}. (from ${fromYYYYMMDDToDDMMYYYY(conflictType.activeFrom)} to ${fromYYYYMMDDToDDMMYYYY(conflictType.activeTill)})`
}

// Input validation for required fields, types, and formats is handled by @class.validation.js

const addClass = asyncHandler(async (req, res) => {
    const {
        teacherId,
        startTime,
        endTime,
        dayOfWeek,
        roomId,
        batchId,
        activeFrom,
        activeTill,
        courseId,
        timetableId
    } = req.body;

    // Only check for DB existence and business logic, not input validation

    // Check if all referenced IDs exist in the database
    const teacher = await Teacher.findByPk(teacherId);

    if (!teacher) {
        throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");
    }

    const course = await Course.findByPk(courseId);
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, "Course not found");

    const room = await Room.findByPk(roomId);
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");

    // Check batch only for practical/tutorial
    let batch = null;
    if (batchId) {
        batch = await Batch.findByPk(batchId);
        if (!batch) throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Batch doesn't belong to the same division as the timetable")
        }
    }

    // Check if the course is available for that particular semester number in that branch
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)
    const branch = await Branch.findByPk(semester.branchId)

    const checkCourseAvailableForSpecificSemester = await BranchCourseSemester.findOne({
        where: {
            courseId: courseId,
            semesterNumber: semester.semesterNumber,
            branchId: semester.branchId
        }
    })

    if (!checkCourseAvailableForSpecificSemester) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }

    // Check if dates are in bounds of semester dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }
    if (activeTill < semester.startDate || activeTill > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }

    // Check if teacher teaches the course
    const teacherTeachesCourse = await TeacherTeachesCourse.findOne({
        where: {
            teacherId: teacherId,
            courseId: courseId
        }
    })
    if (!teacherTeachesCourse) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Selected teacher haven't assigned the selected course, Assign this course to teacher before creating the class")
    }

    // Check for teacher conflict
    const teacherConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { teacherId: teacherId },
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (teacherConflict) {
        const msg = await getThrowableConflictMessage(teacherConflict, "Teacher unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId },
                { isExtraClass: false },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: false },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: false },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: batchId }
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    const classObj = await Class.create(
        {
            teacherId: teacherId || null,
            startTime: startTime || null,
            endTime: endTime || null,
            dayOfWeek: dayOfWeek || null,
            roomId: roomId || null,
            batchId: batchId || null,
            activeFrom: activeFrom || null,
            activeTill: activeTill || null,
            courseId: courseId || null,
            timetableId: timetableId || null
        }
    );

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Class added successfully", classObj));
});

const getClasses = asyncHandler(async (req, res) => {
    const {
        searchQuery,
        timetableId,
        divisionId,
        startTime,
        endTime,
        activeFrom,
        activeTill,
        teacherId,
        dayOfWeek,
        roomId,
        batchId,
        courseType,
        semesterId,
        semesterNumber,
        academicStartYearOfSemester,
        academicEndYearOfSemester,
        branchId,
        isExtraClass,
        page = 1,
        limit = 10,
        getAll = false,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const classes = await Class.findAndCountAll({
        where: {
            [Op.and]: [
                ...(timetableId ? [{ timetableId: timetableId }] : []),
                // Time range overlap: find classes that overlap with the query time range
                ...(startTime ? [{ endTime: { [Op.gt]: startTime } }] : []),
                ...(endTime ? [{ startTime: { [Op.lt]: endTime } }] : []),
                // Date range overlap: find classes that overlap with the query date range
                ...(activeFrom ? [{ activeTill: { [Op.gte]: activeFrom } }] : []),
                ...(activeTill ? [{ activeFrom: { [Op.lte]: activeTill } }] : []),
                ...(teacherId ? [{ teacherId: teacherId }] : []),
                ...(dayOfWeek ? [{ dayOfWeek: dayOfWeek }] : []),
                ...(roomId ? [{ roomId: roomId }] : []),
                ...(batchId ? [{ batchId: batchId }] : []),
                ...(isExtraClass === true ? [{ isExtraClass: true }] : []),
            ]
        },
        include: [
            {
                model: Course,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(searchQuery ? [{ name: { [Op.iLike]: `%${searchQuery}%` } }] : []),
                        ...(courseType ? [{ courseType: courseType }] : [])
                    ]
                }
            },
            {
                model: Timetable,
                required: true,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{ divisionId: divisionId }] : []),
                    ]
                },
                include: [
                    {
                        model: Division,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Semester,
                                required: true,
                                duplicating: false,
                                where: {
                                    [Op.and]: [
                                        ...(semesterId ? [{ id: semesterId }] : []),
                                        ...(semesterNumber ? [{ semesterNumber: semesterNumber }] : []),
                                        ...(academicStartYearOfSemester ? [{ academicStartYear: academicStartYearOfSemester }] : []),
                                        ...(academicEndYearOfSemester ? [{ academicEndYear: academicEndYearOfSemester }] : []),
                                    ]
                                },
                                include: [
                                    {
                                        model: Branch,
                                        required: true,
                                        duplicating: false,
                                        where: {
                                            [Op.and]: [
                                                ...(branchId ? [{ id: branchId }] : []),
                                            ]
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: Room,
                required: true,
                duplicating: false,
            },
            {
                model: Batch,
                required: false,
                duplicating: false,
            },
            {
                model: Teacher,
                required: true,
                duplicating: false
            }
        ],
        order: [['startTime', 'ASC']],
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Classes retrieved successfully.", {
        classes: classes.rows,
        totalCount: classes.count
    }));
});

const getStudentsUpcomingClasses = asyncHandler(async (req, res) => {
    const studentId = req.student?.id;

    if (!studentId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Student authentication required');
    }

    const now = new Date();
    const todayDate = getDateStringFromObj(now);
    const currentTime = now.toTimeString().slice(0, 8);

    const studentDivisions = await StudentDivision.findAll({
        where: {
            studentId,
            [Op.and]: [
                { startDate: { [Op.lte]: todayDate } },
                {
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: todayDate } }
                    ]
                }
            ]
        },
        attributes: ['divisionId'],
        raw: true
    });

    const divisionIds = [...new Set(studentDivisions.map((studentDivision) => studentDivision.divisionId))];

    if (divisionIds.length === 0) {
        return res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Upcoming classes retrieved successfully.', {
            classes: [],
            totalCount: 0
        }));
    }

    const studentBatches = await StudentBatch.findAll({
        where: {
            studentId,
            [Op.and]: [
                { startDate: { [Op.lte]: todayDate } },
                {
                    [Op.or]: [
                        { endDate: null },
                        { endDate: { [Op.gte]: todayDate } }
                    ]
                }
            ]
        },
        attributes: ['batchId'],
        raw: true
    });

    const batchIds = [...new Set(studentBatches.map((studentBatch) => studentBatch.batchId))];

    const timetables = await Timetable.findAll({
        where: {
            divisionId: {
                [Op.in]: divisionIds
            }
        },
        attributes: ['id'],
        raw: true
    });

    const timetableIds = [...new Set(timetables.map((timetable) => timetable.id))];

    if (timetableIds.length === 0) {
        return res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Upcoming classes retrieved successfully.', {
            classes: [],
            totalCount: 0
        }));
    }

    const classes = await Class.findAll({
        where: {
            [Op.and]: [
                {
                    timetableId: {
                        [Op.in]: timetableIds
                    }
                },
                {
                    activeTill: {
                        [Op.gte]: todayDate
                    }
                },
                {
                    [Op.or]: [
                        { batchId: null },
                        ...(batchIds.length > 0 ? [{ batchId: { [Op.in]: batchIds } }] : [])
                    ]
                }
            ]
        },
        include: [
            {
                model: Course,
                required: true,
                duplicating: false
            },
            {
                model: Timetable,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Division,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Semester,
                                required: true,
                                duplicating: false,
                                include: [
                                    {
                                        model: Branch,
                                        required: true,
                                        duplicating: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: Room,
                required: true,
                duplicating: false
            },
            {
                model: Batch,
                required: false,
                duplicating: false
            },
            {
                model: Teacher,
                required: true,
                duplicating: false
            }
        ]
    });

    const upcomingClasses = classes
        .map((classObj) => {
            const nextClassDate = getNextOccurrenceDate({
                classDayOfWeek: classObj.dayOfWeek,
                classStartTime: classObj.startTime,
                activeFrom: classObj.activeFrom,
                activeTill: classObj.activeTill,
                todayDate,
                currentTime: '00:00:00'
            });

            if (!nextClassDate) {
                return null;
            }

            return {
                ...classObj.toJSON(),
                nextClassDate
            };
        })
        .filter(Boolean)
        .sort((firstClass, secondClass) => {
            if (firstClass.nextClassDate !== secondClass.nextClassDate) {
                return firstClass.nextClassDate.localeCompare(secondClass.nextClassDate);
            }

            return firstClass.startTime.localeCompare(secondClass.startTime);
        });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Upcoming classes retrieved successfully.', {
        classes: upcomingClasses,
        totalCount: upcomingClasses.length
    }));
});

const getTeachersUpcomingClasses = asyncHandler(async (req, res) => {
    const teacherId = req.teacher?.id;

    if (!teacherId) {
        throw new ApiError(httpStatus.UNAUTHORIZED, 'Teacher authentication required');
    }

    const now = new Date();
    const todayDate = getDateStringFromObj(now);
    const currentTime = now.toTimeString().slice(0, 8);

    const classes = await Class.findAll({
        where: {
            [Op.and]: [
                { teacherId },
                {
                    activeTill: {
                        [Op.gte]: todayDate
                    }
                }
            ]
        },
        include: [
            {
                model: Course,
                required: true,
                duplicating: false
            },
            {
                model: Timetable,
                required: true,
                duplicating: false,
                include: [
                    {
                        model: Division,
                        required: true,
                        duplicating: false,
                        include: [
                            {
                                model: Semester,
                                required: true,
                                duplicating: false,
                                include: [
                                    {
                                        model: Branch,
                                        required: true,
                                        duplicating: false
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                model: Room,
                required: true,
                duplicating: false
            },
            {
                model: Batch,
                required: false,
                duplicating: false
            },
            {
                model: Teacher,
                required: true,
                duplicating: false
            }
        ]
    });

    const upcomingClasses = classes
        .map((classObj) => {
            const nextClassDate = getNextOccurrenceDate({
                classDayOfWeek: classObj.dayOfWeek,
                classStartTime: classObj.startTime,
                activeFrom: classObj.activeFrom,
                activeTill: classObj.activeTill,
                todayDate,
                currentTime: '00:00:00'
            });

            if (!nextClassDate) {
                return null;
            }

            return {
                ...classObj.toJSON(),
                nextClassDate
            };
        })
        .filter(Boolean)
        .sort((firstClass, secondClass) => {
            if (firstClass.nextClassDate !== secondClass.nextClassDate) {
                return firstClass.nextClassDate.localeCompare(secondClass.nextClassDate);
            }

            return firstClass.startTime.localeCompare(secondClass.startTime);
        });

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, 'Upcoming classes retrieved successfully.', {
        classes: upcomingClasses,
        totalCount: upcomingClasses.length
    }));
});

const getClassById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation for id is handled by @class.validation.js

    const classObj = await Class.findByPk(
        id,
        {
            include: [
                {
                    model: Course,
                    required: true,
                    duplicating: false
                },
                {
                    model: Timetable,
                    required: true,
                    duplicating: false,
                    include: [
                        {
                            model: Division,
                            required: true,
                            duplicating: false,
                            include: [
                                {
                                    model: Semester,
                                    required: true,
                                    duplicating: false,
                                    include: [
                                        {
                                            model: Branch,
                                            required: true,
                                            duplicating: false
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                },
                {
                    model: Room,
                    required: false,
                    duplicating: false,
                },
                {
                    model: Batch,
                    required: false,
                    duplicating: false,
                },
                {
                    model: Teacher,
                    required: true,
                    duplicating: false
                }
            ]
        })

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    res
        .status(httpStatus.OK)
        .json(
            new ApiResponse(
                httpStatus.OK,
                "Class fetched successfully",
                classObj
            )
        );
});

const editActiveDatesOfClass = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { newActiveFrom, newActiveTill } = req.body;

    // Input validation for id, newActiveFrom, and newActiveTill is handled by @class.validation.js

    const classObj = await Class.findByPk(id);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    const timetable = await Timetable.findByPk(classObj.timetableId)
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)

    // Update activeFrom if provided
    if (newActiveFrom) {
        if (newActiveFrom < semester.startDate || newActiveFrom > semester.endDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, `New active from date must be within semester bounds (${semester.startDate} to ${semester.endDate})`);
        }
        classObj.activeFrom = newActiveFrom;
    }

    // Update activeTill if provided
    if (newActiveTill) {
        if (newActiveTill < semester.startDate || newActiveTill > semester.endDate) {
            throw new ApiError(httpStatus.BAD_REQUEST, `New active till date must be within semester bounds (${semester.startDate} to ${semester.endDate})`);
        }
        classObj.activeTill = newActiveTill;
    }

    // Validate that activeFrom is before activeTill
    if (classObj.activeFrom >= classObj.activeTill) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Active from date must be before active till date");
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { id: { [Op.ne]: classObj.id } },
                { roomId: classObj.roomId },
                { dayOfWeek: classObj.dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                        { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                        { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                        { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                        { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (classObj.batchId == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId },
                    { dayOfWeek: classObj.dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (classObj.batchId != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { id: { [Op.ne]: classObj.id } },
                    { timetableId: classObj.timetableId },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: classObj.batchId }
                            ]
                        }
                    },
                    { dayOfWeek: classObj.dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { endTime: { [Op.gt]: classObj.startTime, [Op.lt]: classObj.endTime } },
                            { startTime: { [Op.lte]: classObj.startTime }, endTime: { [Op.gte]: classObj.endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeTill: { [Op.gte]: classObj.activeFrom, [Op.lte]: classObj.activeTill } },
                            { activeFrom: { [Op.lte]: classObj.activeFrom }, activeTill: { [Op.gte]: classObj.activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    await classObj.save()
    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class updated successfully", classObj));
});

const removeClass = asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Input validation for id is handled by @class.validation.js

    const classObj = await Class.findByPk(id);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    await classObj.destroy();

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class deleted successfully", null));
});

const addExtraClass = asyncHandler(async (req, res) => {
    const {
        teacherId,
        startTime,
        endTime,
        dayOfWeek,
        roomId,
        batchId,
        activeFrom,
        activeTill,
        courseId,
        timetableId
    } = req.body;

    // Only check for DB existence and business logic, not input validation

    // Check if all referenced IDs exist in the database
    const teacher = await Teacher.findByPk(teacherId);
    if (!teacher) throw new ApiError(httpStatus.NOT_FOUND, "Teacher not found");

    const course = await Course.findByPk(courseId);
    if (!course) throw new ApiError(httpStatus.NOT_FOUND, "Course not found");

    const room = await Room.findByPk(roomId);
    if (!room) throw new ApiError(httpStatus.NOT_FOUND, "Room not found");

    const timetable = await Timetable.findByPk(timetableId);
    if (!timetable) throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found");

    // Check batch only for practical/tutorial
    let batch = null;
    if (batchId) {
        batch = await Batch.findByPk(batchId);
        if (!batch) throw new ApiError(httpStatus.NOT_FOUND, "Batch not found");
        if (batch.divisionId != timetable.divisionId) {
            throw new ApiError(httpStatus.BAD_REQUEST, "Batch doesn't belong to the same division as the timetable")
        }
    }

    // Check if the course is available for that particular semester number in that branch
    const division = await Division.findByPk(timetable.divisionId)
    const semester = await Semester.findByPk(division.semesterId)
    const branch = await Branch.findByPk(semester.branchId)

    const checkCourseAvailableForSpecificSemester = await BranchCourseSemester.findOne({
        where: {
            courseId: courseId,
            semesterNumber: semester.semesterNumber,
            branchId: semester.branchId
        }
    })

    if (!checkCourseAvailableForSpecificSemester) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Course '${course.name}' is not in syllabus for semester ${semester.semesterNumber} of branch ${branch.name}`)
    }

    // Check if dates are in bounds of semester dates
    if (activeFrom < semester.startDate || activeFrom > semester.endDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active from date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }
    if (activeTill > semester.endDate || activeTill < semester.startDate) {
        throw new ApiError(httpStatus.BAD_REQUEST, `Active till date is out of bounds because semester start date is ${semester.startDate} and semester end date is ${semester.endDate}`)
    }
    const extraClassConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { isExtraClass: true },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })

    if (extraClassConflict) {
        const msg = await getThrowableConflictMessage(extraClassConflict, "Another extra class is scheduled at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }
    // Check for teacher conflict
    const teacherConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { teacherId: teacherId },
                { dayOfWeek: dayOfWeek },
                { isExtraClass: true },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (teacherConflict) {
        const msg = await getThrowableConflictMessage(teacherConflict, "Teacher unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for room conflict
    const roomConflict = await Class.findOne({
        where: {
            [Op.and]: [
                { roomId: roomId },
                { isExtraClass: true },
                { dayOfWeek: dayOfWeek },
                {
                    [Op.or]: [
                        { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                        { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                    ]
                },
                {
                    [Op.or]: [
                        { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                        { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                    ]
                }
            ]
        }
    })
    if (roomConflict) {
        const msg = await getThrowableConflictMessage(roomConflict, "Room unavailable at this time: ")
        throw new ApiError(httpStatus.CONFLICT, msg)
    }

    // Check for division conflict (lecture)
    if (batch == null) {
        const multipleLecturesConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: true },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multipleLecturesConflict) {
            const msg = await getThrowableConflictMessage(multipleLecturesConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    // Check for batch conflict (practical/tutorial)
    if (batch != null) {
        const multiplePracticalsConflict = await Class.findOne({
            where: {
                [Op.and]: [
                    { timetableId: timetableId },
                    { isExtraClass: true },
                    {
                        batchId: {
                            [Op.or]: [
                                { [Op.eq]: null },
                                { [Op.eq]: batchId }
                            ]
                        }
                    },
                    { dayOfWeek: dayOfWeek },
                    {
                        [Op.or]: [
                            { startTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { endTime: { [Op.gt]: startTime, [Op.lt]: endTime } },
                            { startTime: { [Op.lte]: startTime }, endTime: { [Op.gte]: endTime } }
                        ]
                    },
                    {
                        [Op.or]: [
                            { activeFrom: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeTill: { [Op.gte]: activeFrom, [Op.lte]: activeTill } },
                            { activeFrom: { [Op.lte]: activeFrom }, activeTill: { [Op.gte]: activeTill } }
                        ]
                    }
                ]
            }
        })
        if (multiplePracticalsConflict) {
            const msg = await getThrowableConflictMessage(multiplePracticalsConflict, "Time slot isn't free: ")
            throw new ApiError(httpStatus.CONFLICT, msg)
        }
    }

    const classObj = await Class.create(
        {
            teacherId: teacherId || null,
            startTime: startTime || null,
            endTime: endTime || null,
            dayOfWeek: dayOfWeek || null,
            roomId: roomId || null,
            batchId: batchId || null,
            activeFrom: activeFrom || null,
            activeTill: activeTill || null,
            courseId: courseId || null,
            timetableId: timetableId || null,
            isExtraClass: true
        }
    );

    let studentsToNotify = []
    if (batch) {
        studentsToNotify = await StudentBatch.findAll({
            where: {
                batchId: batch.id,
                endDate: null
            }
        })
    } else {
        studentsToNotify = await StudentDivision.findAll({
            where: {
                divisionId: timetable.divisionId,
                endDate: null
            }
        })
    }

    studentsToNotify = studentsToNotify.map(student => student.studentId)

    const studentsWithFCMToken = await StudentFCMToken.findAll({
        where: {
            studentId: {
                [Op.in]: studentsToNotify
            }
        }
    })

    studentsWithFCMToken.forEach(studentWithFCMToken => {
        sendNotification(
            studentWithFCMToken.fcmToken,
            "Extra lecture scheduled",
            `Extra lecture from ${getTimeInTwelveHourFormat(classObj.startTime)} to ${getTimeInTwelveHourFormat(classObj.endTime)} on ${classObj.dayOfWeek} of ${course.name} is scheduled`,
            {
                type: "ExtraLectureAdded",
                classId: classObj.id,
            }
        )
    })

    res.status(httpStatus.CREATED).json(new ApiResponse(httpStatus.CREATED, "Class added successfully", classObj));
})

const cancelClass = asyncHandler(async (req, res) => {
    const {
        classId,
        reason,
        date
    } = req.body;

    // Input validation for classId and date is handled by @class.validation.js

    const classObj = await Class.findByPk(classId);

    if (!classObj) throw new ApiError(httpStatus.NOT_FOUND, "Class not found");

    // Joi may coerce date to a Date object; normalize to 'YYYY-MM-DD' for lexicographic comparison
    const normalizedDate = typeof date === 'string' ? date : getDateStringFromObj(date);

    if (normalizedDate > classObj.activeTill || normalizedDate < classObj.activeFrom) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Date is not in bounds of active from and active till of class");
    }

    const isAlreadyCancelled = await CancelledClass.findOne({
        where: {
            classId: classId,
            date: normalizedDate
        }
    })

    if (isAlreadyCancelled) {
        throw new ApiError(httpStatus.CONFLICT, "Class is already cancelled")
    }

    await CancelledClass.create(
        {
            classId: classId,
            date: normalizedDate,
            reason: reason || null
        }
    );

    // sending notification to the students
    let studentsToNotify = []
    let batch = null;
    if (classObj.batchId) {
        batch = await Batch.findByPk(classObj.batchId);
    }
    const timetable = await Timetable.findByPk(classObj.timetableId);
    const course = await Course.findByPk(classObj.courseId);

    if (batch) {
        studentsToNotify = await StudentBatch.findAll({
            where: {
                batchId: batch.id,
                endDate: null
            }
        })
    } else {
        studentsToNotify = await StudentDivision.findAll({
            where: {
                divisionId: timetable.divisionId,
                endDate: null
            }
        })
    }

    studentsToNotify = studentsToNotify.map(student => student.studentId)

    const studentsWithFCMToken = await StudentFCMToken.findAll({
        where: {
            studentId: {
                [Op.in]: studentsToNotify
            }
        }
    })

    studentsWithFCMToken.forEach(studentWithFCMToken => {
        sendNotification(
            studentWithFCMToken.fcmToken,
            "Class cancelled",
            `Class of ${course.name} from ${getTimeInTwelveHourFormat(classObj.startTime)} to ${getTimeInTwelveHourFormat(classObj.endTime)} on ${formatDateReadable(normalizedDate)} is cancelled`,
            {
                type: "ClassCancelled",
                classId: classObj.id,
                cancelDate: formatDateReadable(normalizedDate)
            }
        )
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Class marked as cancelled successfully", null));
});

const getCancelledClasses = asyncHandler(async (req, res) => {
    const {
        divisionId,
        batchId,
        date,
        page = 1,
        limit = 10,
        getAll = false,
    } = req.query;

    const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    // Input validation for date is handled by @class.validation.js

    let timetableOfDivision = null
    if (divisionId) {
        timetableOfDivision = await Timetable.findOne({
            where: {
                divisionId: divisionId
            }
        })
        if (!timetableOfDivision) {
            throw new ApiError(httpStatus.NOT_FOUND, "Timetable not found")
        }
    }

    const cancelledClasses = await CancelledClass.findAndCountAll({
        where: {
            [Op.and]: [
                ...(date ? [{ date: date }] : [])
            ]
        },
        include: [
            {
                model: Class,
                required: divisionId || batchId ? true : false,
                duplicating: false,
                where: {
                    [Op.and]: [
                        ...(divisionId ? [{ timetableId: timetableOfDivision.id }] : []),
                        ...(batchId ? [{ batchId: batchId }] : [])
                    ]
                }
            }
        ],
        ...(limit && getAll === false ? { offset: offset, } : {}),
        ...(limit && getAll === false ? { limit: parseInt(limit, 10) } : {})
    })

    res.status(httpStatus.OK).json(new ApiResponse(httpStatus.OK, "Cancelled classes retrieved successfully.", {
        cancelledClasses: cancelledClasses.rows,
        totalCount: cancelledClasses.count
    }));
});


//* Bulk Create Classes
const bulkCreateClasses = asyncHandler(async (req, res) => {
    const { classes } = req.body;

    if (!classes || !Array.isArray(classes) || classes.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Classes array is required and must not be empty");
    }

    // logging removed

    const transaction = await sequelize.transaction();
    try {
        const createdClasses = [];
        const errors = [];

        for (let i = 0; i < classes.length; i++) {
            const classData = classes[i];

            // Existence checks (Joi already validated shapes)
            const teacher = await Teacher.findByPk(classData.teacherId, { transaction });
            if (!teacher) {
                errors.push({ index: i, error: 'Teacher not found', type: 'notFound' });
                continue;
            }

            const course = await Course.findByPk(classData.courseId, { transaction });
            if (!course) {
                errors.push({ index: i, error: 'Course not found', type: 'notFound' });
                continue;
            }

            const room = await Room.findByPk(classData.roomId, { transaction });
            if (!room) {
                errors.push({ index: i, error: 'Room not found', type: 'notFound' });
                continue;
            }

            const timetable = await Timetable.findByPk(classData.timetableId, { transaction });
            if (!timetable) {
                errors.push({ index: i, error: 'Timetable not found', type: 'notFound' });
                continue;
            }

            if (classData.batchId) {
                const batch = await Batch.findByPk(classData.batchId, { transaction });
                if (!batch) {
                    errors.push({ index: i, error: 'Batch not found', type: 'notFound' });
                    continue;
                }
            }

            // Basic scheduling conflict checks: room and teacher overlap on same day
            const overlapWindow = {
                [Op.or]: [
                    { startTime: { [Op.between]: [classData.startTime, classData.endTime] } },
                    { endTime: { [Op.between]: [classData.startTime, classData.endTime] } },
                    { startTime: { [Op.lte]: classData.startTime }, endTime: { [Op.gte]: classData.endTime } }
                ]
            };

            const timeRangeOverlap = overlapWindow;

            const roomConflict = await Class.findOne({
                where: {
                    dayOfWeek: classData.dayOfWeek,
                    roomId: classData.roomId,
                    ...timeRangeOverlap
                },
                transaction
            });

            const teacherConflict = await Class.findOne({
                where: {
                    dayOfWeek: classData.dayOfWeek,
                    teacherId: classData.teacherId,
                    ...timeRangeOverlap
                },
                transaction
            });

            if (roomConflict || teacherConflict) {
                errors.push({ index: i, error: 'scheduling conflict: overlapping time slot', type: 'conflict' });
                continue;
            }

            const classObj = await Class.create({
                teacherId: classData.teacherId,
                startTime: classData.startTime,
                endTime: classData.endTime,
                dayOfWeek: classData.dayOfWeek,
                roomId: classData.roomId,
                batchId: classData.batchId || null,
                activeFrom: classData.activeFrom,
                activeTill: classData.activeTill,
                courseId: classData.courseId,
                timetableId: classData.timetableId,
                isExtraClass: classData.isExtraClass || false
            }, { transaction });

            createdClasses.push(classObj);
        }

        // Decide outcome: all-or-nothing based on errors
        if (errors.length > 0) {
            await transaction.rollback();
            const notFound = errors.find(e => e.type === 'notFound');
            if (notFound) {
                throw new ApiError(httpStatus.NOT_FOUND, notFound.error);
            }
            const conflict = errors.find(e => e.type === 'conflict');
            if (conflict) {
                throw new ApiError(httpStatus.CONFLICT, conflict.error);
            }
            // Fallback
            throw new ApiError(httpStatus.BAD_REQUEST, errors[0].error || 'Bulk class creation failed');
        }

        await transaction.commit();

        // logging removed

        res.status(httpStatus.CREATED).json(
            new ApiResponse(
                httpStatus.CREATED,
                'Classes created successfully',
                {
                    createdClasses,
                    summary: {
                        total: classes.length,
                        created: createdClasses.length,
                        failed: 0
                    }
                }
            )
        );

    } catch (error) {
        // Make sure transaction is rolled back if still active
        try { await transaction.rollback(); } catch (_) { }
        // logging removed
        // If it's already an ApiError (like 404/409), rethrow as-is
        if (error instanceof ApiError) {
            throw error;
        }
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Bulk class creation failed");
    }
});

//* Bulk Delete Classes
const bulkDeleteClasses = asyncHandler(async (req, res) => {
    const { classIds } = req.body;

    if (!classIds || !Array.isArray(classIds) || classIds.length === 0) {
        throw new ApiError(httpStatus.BAD_REQUEST, "Class IDs array is required and must not be empty");
    }

    // Deduplicate IDs
    const uniqueIds = [...new Set(classIds)];

    // logging removed

    const transaction = await sequelize.transaction();
    try {
        // Fetch existing classes for provided IDs
        const existingClasses = await Class.findAll({
            where: { id: { [Op.in]: uniqueIds } },
            transaction
        });

        const existingIds = new Set(existingClasses.map(c => c.id));
        const notFoundIds = uniqueIds.filter(id => !existingIds.has(id));

        if (notFoundIds.length > 0) {
            // Some requested classes do not exist
            throw new ApiError(httpStatus.NOT_FOUND, "Some classes not found");
        }

        // Check for dependent attendance records before deletion
        // Note: Attendance model is defined together with AttendanceStudent
        // import locally to avoid circular deps in some environments
        const { Attendance } = await import('../db/models/attendance.model.js');

        const dependentCount = await Attendance.count({
            where: { classId: { [Op.in]: uniqueIds } },
            transaction
        });

        if (dependentCount > 0) {
            throw new ApiError(httpStatus.CONFLICT, "Cannot delete class due to dependent records (attendance)");
        }

        const deletedCount = await Class.destroy({
            where: { id: { [Op.in]: uniqueIds } },
            transaction
        });

        await transaction.commit();

        // logging removed

        res.status(httpStatus.OK).json(
            new ApiResponse(
                httpStatus.OK,
                "Classes deleted successfully",
                {
                    deletedCount,
                    requestedCount: uniqueIds.length
                }
            )
        );

    } catch (error) {
        await transaction.rollback();
        // logging removed
        throw error;
    }
});

//* Bulk Create Classes via CSV
const bulkCreateClassesFromCSV = asyncHandler(async (req, res) => {
    if (!req.file) {
        throw new ApiError(httpStatus.BAD_REQUEST, "CSV file is required");
    }

    // logging removed

    const csvFilePath = req.file.path;
    const classes = [];

    try {
        // Parse CSV file
        const parseCSV = () => {
            return new Promise((resolve, reject) => {
                fs.createReadStream(csvFilePath)
                    .pipe(csv())
                    .on('data', (row) => {
                        classes.push({
                            teacherId: row.teacherId,
                            startTime: row.startTime,
                            endTime: row.endTime,
                            dayOfWeek: row.dayOfWeek,
                            roomId: row.roomId,
                            batchId: row.batchId || null,
                            activeFrom: row.activeFrom,
                            activeTill: row.activeTill,
                            courseId: row.courseId,
                            timetableId: row.timetableId,
                            isExtraClass: row.isExtraClass === 'true' || false
                        });
                    })
                    .on('end', resolve)
                    .on('error', reject);
            });
        };

        await parseCSV();

        if (classes.length === 0) {
            throw new ApiError(httpStatus.BAD_REQUEST, "No valid classes found in CSV file");
        }

        // Use the existing bulk create logic
        const transaction = await sequelize.transaction();
        try {
            const createdClasses = [];
            const errors = [];

            for (let i = 0; i < classes.length; i++) {
                const classData = classes[i];
                try {
                    // Validate required fields
                    if (!classData.teacherId || !classData.startTime || !classData.endTime ||
                        !classData.dayOfWeek || !classData.roomId || !classData.activeFrom ||
                        !classData.activeTill || !classData.courseId ||
                        !classData.timetableId) {
                        errors.push({ row: i + 1, error: "Missing required fields" });
                        continue;
                    }

                    // Check if all referenced IDs exist
                    const teacher = await Teacher.findByPk(classData.teacherId, { transaction });
                    if (!teacher) {
                        errors.push({ row: i + 1, error: "Teacher not found" });
                        continue;
                    }

                    const course = await Course.findByPk(classData.courseId, { transaction });
                    if (!course) {
                        errors.push({ row: i + 1, error: "Course not found" });
                        continue;
                    }

                    const room = await Room.findByPk(classData.roomId, { transaction });
                    if (!room) {
                        errors.push({ row: i + 1, error: "Room not found" });
                        continue;
                    }

                    const timetable = await Timetable.findByPk(classData.timetableId, { transaction });
                    if (!timetable) {
                        errors.push({ row: i + 1, error: "Timetable not found" });
                        continue;
                    }

                    let batch = null;
                    if (classData.batchId) {
                        batch = await Batch.findByPk(classData.batchId, { transaction });
                        if (!batch) {
                            errors.push({ row: i + 1, error: "Batch not found" });
                            continue;
                        }
                    }

                    const classObj = await Class.create({
                        teacherId: classData.teacherId,
                        startTime: classData.startTime,
                        endTime: classData.endTime,
                        dayOfWeek: classData.dayOfWeek,
                        roomId: classData.roomId,
                        batchId: classData.batchId || null,
                        activeFrom: classData.activeFrom,
                        activeTill: classData.activeTill,
                        courseId: classData.courseId,
                        timetableId: classData.timetableId,
                        isExtraClass: classData.isExtraClass || false
                    }, { transaction });

                    createdClasses.push(classObj);

                } catch (error) {
                    errors.push({ row: i + 1, error: error.message });
                }
            }

            await transaction.commit();

            // Clean up uploaded file
            fs.unlinkSync(csvFilePath);

            // logging removed

            res.status(httpStatus.CREATED).json(
                new ApiResponse(
                    httpStatus.CREATED,
                    `Bulk class creation from CSV completed. Created: ${createdClasses.length}, Errors: ${errors.length}`,
                    {
                        createdClasses,
                        errors,
                        summary: {
                            total: classes.length,
                            created: createdClasses.length,
                            failed: errors.length
                        }
                    }
                )
            );

        } catch (error) {
            await transaction.rollback();
            // Clean up uploaded file
            if (fs.existsSync(csvFilePath)) {
                fs.unlinkSync(csvFilePath);
            }
            throw error;
        }

    } catch (error) {
        // Clean up uploaded file
        if (fs.existsSync(csvFilePath)) {
            fs.unlinkSync(csvFilePath);
        }
        // logging removed
        throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, "Bulk class creation from CSV failed");
    }
});


export {
    addClass,
    getClasses,
    getStudentsUpcomingClasses,
    getTeachersUpcomingClasses,
    getClassById,
    editActiveDatesOfClass,
    removeClass,
    addExtraClass,
    getCancelledClasses,
    cancelClass,
    bulkCreateClasses,
    bulkDeleteClasses,
    bulkCreateClassesFromCSV
}   
