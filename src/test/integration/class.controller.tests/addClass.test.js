import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Semester from '../../../db/models/semester.model.js';
import Division from '../../../db/models/division.model.js';
import Batch from '../../../db/models/batch.model.js';
import Course from '../../../db/models/course.model.js';
import Room from '../../../db/models/room.model.js';
import Timetable from '../../../db/models/timetable.model.js';
import Class from '../../../db/models/class.model.js';
import {
    Attendance,
    AttendanceStudent
} from '../../../db/models/attendance.model.js';
import StudentSemester from '../../../db/models/studentSemester.model.js';
import StudentDivision from '../../../db/models/studentDivision.model.js';
import StudentBatch from '../../../db/models/studentBatch.model.js';
import TeacherTeachesCourse from '../../../db/models/teacherTeachesCourse.model.js';
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';
import {
    ROLES
} from '../../../config/roles.js';
import {
    logger
} from '../../../config/logger.js';

setupTestDb();

describe('Class API - addClass', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let course;
    let room;
    let timetable;
    let teacher;
    let student1;
    let branchCourseSemester;
    let teacherTeachesCourse;

    beforeEach(async () => {
        try {

            await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });
            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: 'admin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            scheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: university.id
            });
            semester = await Semester.create({
                semesterNumber: 1,
                branchId: branch.id,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2025-12-31',
                schemeId: scheme.id
            });
            division = await Division.create({
                divisionCode: 'A',
                semesterId: semester.id
            });
            batch = await Batch.create({
                batchCode: 'Batch 1',
                divisionId: division.id
            });

            teacher = await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            student1 = await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });

            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

            course = await Course.create({
                name: 'Programming Fundamentals',
                code: 'CS101',
                schemeId: scheme.id
            });
            room = await Room.create({
                roomNumber: '101',
                sittingCapacity: 60
            });
            timetable = await Timetable.create({
                divisionId: division.id
            });

            branchCourseSemester = await BranchCourseSemester.create({
                branchId: branch.id,
                courseId: course.id,
                semesterNumber: 1
            });

            teacherTeachesCourse = await TeacherTeachesCourse.create({
                teacherId: teacher.id,
                courseId: course.id
            });
        } catch (error) {
            logger.error('Error in beforeEach:', error);
            throw error;
        }
    });

    describe('POST /api/v1/classes', () => {
        const validClassData = () => ({
            teacherId: teacher.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room.id,
            batchId: null,
            activeFrom: '2025-08-01',
            activeTill: '2025-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/classes').
                send(validClassData()).
                expect(httpStatus.UNAUTHORIZED);

                expect(response.body.message).toBe('Unauthorized request: No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', 'Bearer invalid-token').
                send(validClassData()).
                expect(httpStatus.UNAUTHORIZED);

                expect(response.body.message).toBe('Unauthorized request: Invalid token');
            });
        });

        describe('Authorization', () => {
            test('should return 403 if student tries to add class', async () => {
                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${studentToken}`).
                send(validClassData()).
                expect(httpStatus.FORBIDDEN);

                expect(response.body.message).toBe('Forbidden: Insufficient permissions');
            });

            test('should allow admin to add class', async () => {
                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(validClassData()).
                expect(httpStatus.CREATED);

                expect(response.body.message).toBe('Class added successfully');
                expect(response.body.data).toHaveProperty('id');
            });

        });

        describe('Input Validation', () => {
            test('should return 400 if teacherId is missing', async () => {
                const classData = validClassData();
                delete classData.teacherId;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Teacher ID is required');
            });

            test('should return 400 if teacherId is not a valid UUID', async () => {
                const classData = validClassData();
                classData.teacherId = 'invalid-uuid';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Teacher ID must be a valid UUID');
            });

            test('should return 400 if startTime is missing', async () => {
                const classData = validClassData();
                delete classData.startTime;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Start time is required');
            });

            test('should return 400 if startTime format is invalid', async () => {
                const classData = validClassData();
                classData.startTime = '9:00';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Start time must be in HH:mm:ss format');
            });

            test('should return 400 if endTime is missing', async () => {
                const classData = validClassData();
                delete classData.endTime;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('End time is required');
            });

            test('should return 400 if endTime format is invalid', async () => {
                const classData = validClassData();
                classData.endTime = '10:00';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('End time must be in HH:mm:ss format');
            });

            test('should return 400 if dayOfWeek is missing', async () => {
                const classData = validClassData();
                delete classData.dayOfWeek;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Day of week is required');
            });

            test('should return 400 if roomId is missing', async () => {
                const classData = validClassData();
                delete classData.roomId;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Room ID is required');
            });

            test('should return 400 if activeFrom is missing', async () => {
                const classData = validClassData();
                delete classData.activeFrom;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Active from date is required');
            });

            test('should return 400 if activeTill is missing', async () => {
                const classData = validClassData();
                delete classData.activeTill;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Active till date is required');
            });

            test('should return 400 if classType is missing', async () => {
                const classData = validClassData();
                delete classData.classType;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Class type is required');
            });

            test('should return 400 if classType is invalid', async () => {
                const classData = validClassData();
                classData.classType = 'InvalidType';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe("Class type must be 'Lecture', 'Tutorial' or 'Practical'");
            });

            test('should return 400 if courseId is missing', async () => {
                const classData = validClassData();
                delete classData.courseId;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Course ID is required');
            });

            test('should return 400 if timetableId is missing', async () => {
                const classData = validClassData();
                delete classData.timetableId;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Timetable ID is required');
            });
        });

        describe('Business Logic Validation', () => {
            test('should return 404 if teacher not found', async () => {
                const classData = validClassData();
                classData.teacherId = '550e8400-e29b-41d4-a716-446655440000';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.NOT_FOUND);

                expect(response.body.message).toBe('Teacher not found');
            });

            test('should return 404 if course not found', async () => {
                const classData = validClassData();
                classData.courseId = '550e8400-e29b-41d4-a716-446655440000';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.NOT_FOUND);

                expect(response.body.message).toBe('Course not found');
            });

            test('should return 404 if room not found', async () => {
                const classData = validClassData();
                classData.roomId = '550e8400-e29b-41d4-a716-446655440000';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.NOT_FOUND);

                expect(response.body.message).toBe('Room not found');
            });

            test('should return 404 if timetable not found', async () => {
                const classData = validClassData();
                classData.timetableId = '550e8400-e29b-41d4-a716-446655440000';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.NOT_FOUND);

                expect(response.body.message).toBe('Timetable not found');
            });

            test('should return 404 if batch not found for Tutorial/Practical', async () => {
                const classData = validClassData();
                classData.classType = 'Tutorial';
                classData.batchId = '550e8400-e29b-41d4-a716-446655440000';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.NOT_FOUND);

                expect(response.body.message).toBe('Batch not found');
            });

            test('should return 400 if batch does not belong to same division as timetable', async () => {

                const anotherDivision = await Division.create({
                    divisionCode: 'B',
                    semesterId: semester.id
                });
                const anotherBatch = await Batch.create({
                    batchCode: 'Batch 2',
                    divisionId: anotherDivision.id
                });

                const classData = validClassData();
                classData.classType = 'Tutorial';
                classData.batchId = anotherBatch.id;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe("Batch doesn't belong to the same division as the timetable");
            });

            test('should return 400 if course is not in syllabus for semester', async () => {

                await branchCourseSemester.destroy();

                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toContain("Course 'Programming Fundamentals' is not in syllabus for semester 1 of branch Computer Science");
            });

            test('should return 400 if activeFrom date is out of semester bounds', async () => {
                const classData = validClassData();
                classData.activeFrom = '2025-07-01';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toContain('Active from date is out of bounds');
            });

            test('should return 400 if activeTill date is out of semester bounds', async () => {
                const classData = validClassData();
                classData.activeTill = '2026-01-01';

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toContain('Active till date is out of bounds');
            });

            test('should return 400 if teacher is not teaching the course', async () => {

                await teacherTeachesCourse.destroy();

                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.BAD_REQUEST);

                expect(response.body.message).toBe('Teacher is not teaching this course');
            });
        });

        describe('Conflict Validation', () => {
            test('should return 409 if teacher has conflict', async () => {

                await Class.create({
                    teacherId: teacher.id,
                    startTime: '09:30:00',
                    endTime: '10:30:00',
                    dayOfWeek: 'Monday',
                    roomId: room.id,
                    batchId: null,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: course.id,
                    timetableId: timetable.id,
                    isExtraClass: false
                });

                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CONFLICT);

                expect(response.body.message).toContain('Teacher unavailable at this time');
            });

            test('should return 409 if room has conflict', async () => {

                const anotherTeacher = await Teacher.create({
                    firstName: 'Jane',
                    lastName: 'Doe',
                    email: 'teacher2@example.com',
                    phoneNumber: '+911234567891',
                    password: 'Teacher@123',
                    gender: 'Female',
                    role: 'Teacher'
                });

                const anotherCourse = await Course.create({
                    name: 'Data Structures',
                    code: 'CS102',
                    schemeId: scheme.id
                });

                await BranchCourseSemester.create({
                    branchId: branch.id,
                    courseId: anotherCourse.id,
                    semesterNumber: 1
                });

                await TeacherTeachesCourse.create({
                    teacherId: anotherTeacher.id,
                    courseId: anotherCourse.id
                });

                await Class.create({
                    teacherId: anotherTeacher.id,
                    startTime: '09:30:00',
                    endTime: '10:30:00',
                    dayOfWeek: 'Monday',
                    roomId: room.id,
                    batchId: null,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: anotherCourse.id,
                    timetableId: timetable.id,
                    isExtraClass: false
                });

                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CONFLICT);

                expect(response.body.message).toContain('Room unavailable at this time');
            });

            test('should return 409 if division has lecture conflict', async () => {

                const anotherTeacher = await Teacher.create({
                    firstName: 'Bob',
                    lastName: 'Smith',
                    email: 'teacher3@example.com',
                    phoneNumber: '+911234567892',
                    password: 'Teacher@123',
                    gender: 'Male',
                    role: 'Teacher'
                });

                const anotherCourse = await Course.create({
                    name: 'Mathematics',
                    code: 'MATH101',
                    schemeId: scheme.id
                });

                const anotherRoom = await Room.create({
                    roomNumber: '102',
                    sittingCapacity: 60
                });

                await BranchCourseSemester.create({
                    branchId: branch.id,
                    courseId: anotherCourse.id,
                    semesterNumber: 1
                });

                await TeacherTeachesCourse.create({
                    teacherId: anotherTeacher.id,
                    courseId: anotherCourse.id
                });

                await Class.create({
                    teacherId: anotherTeacher.id,
                    startTime: '09:30:00',
                    endTime: '10:30:00',
                    dayOfWeek: 'Monday',
                    roomId: anotherRoom.id,
                    batchId: null,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Lecture',
                    courseId: anotherCourse.id,
                    timetableId: timetable.id,
                    isExtraClass: false
                });

                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CONFLICT);

                expect(response.body.message).toContain("Time slot isn't free");
            });

            test('should return 409 if batch has practical/tutorial conflict', async () => {

                const anotherTeacher = await Teacher.create({
                    firstName: 'Alice',
                    lastName: 'Johnson',
                    email: 'teacher4@example.com',
                    phoneNumber: '+911234567893',
                    password: 'Teacher@123',
                    gender: 'Female',
                    role: 'Teacher'
                });

                const anotherCourse = await Course.create({
                    name: 'Physics Lab',
                    code: 'PHY101',
                    schemeId: scheme.id
                });

                const anotherRoom = await Room.create({
                    roomNumber: '103',
                    sittingCapacity: 30
                });

                await BranchCourseSemester.create({
                    branchId: branch.id,
                    courseId: anotherCourse.id,
                    semesterNumber: 1
                });

                await TeacherTeachesCourse.create({
                    teacherId: anotherTeacher.id,
                    courseId: anotherCourse.id
                });

                await Class.create({
                    teacherId: anotherTeacher.id,
                    startTime: '09:30:00',
                    endTime: '10:30:00',
                    dayOfWeek: 'Monday',
                    roomId: anotherRoom.id,
                    batchId: batch.id,
                    activeFrom: '2025-08-01',
                    activeTill: '2025-12-31',
                    classType: 'Practical',
                    courseId: anotherCourse.id,
                    timetableId: timetable.id,
                    isExtraClass: false
                });

                const classData = validClassData();
                classData.classType = 'Tutorial';
                classData.batchId = batch.id;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CONFLICT);

                expect(response.body.message).toContain("Time slot isn't free");
            });
        });

        describe('Successful Class Creation', () => {
            test('should successfully create lecture class', async () => {
                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CREATED);

                expect(response.body.message).toBe('Class added successfully');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.teacherId).toBe(classData.teacherId);
                expect(response.body.data.startTime).toBe(classData.startTime);
                expect(response.body.data.endTime).toBe(classData.endTime);
                expect(response.body.data.dayOfWeek).toBe(classData.dayOfWeek);
                expect(response.body.data.roomId).toBe(classData.roomId);
                expect(response.body.data.batchId).toBeNull();
                expect(response.body.data.classType).toBe(classData.classType);
                expect(response.body.data.courseId).toBe(classData.courseId);
                expect(response.body.data.timetableId).toBe(classData.timetableId);
            });

            test('should successfully create tutorial class with batch', async () => {
                const classData = validClassData();
                classData.classType = 'Tutorial';
                classData.batchId = batch.id;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CREATED);

                expect(response.body.message).toBe('Class added successfully');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.classType).toBe('Tutorial');
                expect(response.body.data.batchId).toBe(batch.id);
            });

            test('should successfully create practical class with batch', async () => {
                const classData = validClassData();
                classData.classType = 'Practical';
                classData.batchId = batch.id;

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CREATED);

                expect(response.body.message).toBe('Class added successfully');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.classType).toBe('Practical');
                expect(response.body.data.batchId).toBe(batch.id);
            });

            test('should verify class is stored in database', async () => {
                const classData = validClassData();

                const response = await request(app).
                post('/api/v1/classes').
                set('Authorization', `Bearer ${adminToken}`).
                send(classData).
                expect(httpStatus.CREATED);

                const createdClass = await Class.findByPk(response.body.data.id);
                expect(createdClass).toBeTruthy();
                expect(createdClass.teacherId).toBe(classData.teacherId);
                expect(createdClass.courseId).toBe(classData.courseId);
                expect(createdClass.roomId).toBe(classData.roomId);
                expect(createdClass.timetableId).toBe(classData.timetableId);
            });
        });
    });
});
