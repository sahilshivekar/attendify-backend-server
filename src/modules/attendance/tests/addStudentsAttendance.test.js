import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
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

describe('Attendance API - addStudentsAttendance', () => {
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
    let classEntity;
    let teacher;
    let student1;
    let student2;
    let student3;
    let attendance;

    beforeEach(async () => {

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
        student2 = await Student.create({
            firstName: 'Bob',
            lastName: 'Johnson',
            email: 'student2@example.com',
            phoneNumber: '+919876543211',
            prn: 'STU002',
            password: 'Student@123',
            schemeId: scheme.id,
            branchId: branch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: 'Male'
        });
        student3 = await Student.create({
            firstName: 'Alice',
            lastName: 'Brown',
            email: 'student3@example.com',
            phoneNumber: '+919876543212',
            prn: 'STU003',
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

        await StudentSemester.create({
            studentId: student1.id,
            semesterId: semester.id
        });
        await StudentSemester.create({
            studentId: student2.id,
            semesterId: semester.id
        });
        await StudentSemester.create({
            studentId: student3.id,
            semesterId: semester.id
        });

        await StudentDivision.create({
            studentId: student1.id,
            divisionId: division.id,
            startDate: '2025-08-01'
        });
        await StudentDivision.create({
            studentId: student2.id,
            divisionId: division.id,
            startDate: '2025-08-01'
        });
        await StudentDivision.create({
            studentId: student3.id,
            divisionId: division.id,
            startDate: '2025-08-01'
        });

        await StudentBatch.create({
            studentId: student1.id,
            batchId: batch.id,
            startDate: '2025-08-01'
        });
        await StudentBatch.create({
            studentId: student2.id,
            batchId: batch.id,
            startDate: '2025-08-01'
        });
        await StudentBatch.create({
            studentId: student3.id,
            batchId: batch.id,
            startDate: '2025-08-01'
        });

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
        classEntity = await Class.create({
            teacherId: teacher.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room.id,
            batchId: batch.id,
            activeFrom: '2025-01-01',
            activeTill: '2025-12-31',
            classType: 'Lecture',
            courseId: course.id,
            timetableId: timetable.id
        });

        attendance = await Attendance.create({
            classId: classEntity.id,
            date: '2025-09-10'
        });
    });

    describe('POST /api/v1/attendances/students', () => {
        const validAttendanceData = () => ({
            attendanceId: attendance.id,
            presentStudentIds: [student1.id, student2.id],
            absentStudentIds: [student3.id]
        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/attendances/students').
                send(validAttendanceData());
                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', 'Bearer invalidtoken').
                send(validAttendanceData());
                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid token');
            });

            test('should return 403 if student tries to add attendance', async () => {
                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${studentToken}`).
                send(validAttendanceData());
                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });
        });

        describe('Validation', () => {
            test('should return 400 if attendanceId is missing', async () => {
                const invalidData = {
                    ...validAttendanceData()
                };
                delete invalidData.attendanceId;

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance ID is required');
            });

            test('should return 400 if attendanceId is not a valid UUID', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    attendanceId: 'invalid-uuid'
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance ID must be a valid UUID');
            });

            test('should return 400 if presentStudentIds is missing', async () => {
                const invalidData = {
                    ...validAttendanceData()
                };
                delete invalidData.presentStudentIds;

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Present student IDs are required');
            });

            test('should return 400 if absentStudentIds is missing', async () => {
                const invalidData = {
                    ...validAttendanceData()
                };
                delete invalidData.absentStudentIds;

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Absent student IDs are required');
            });

            test('should return 400 if presentStudentIds contains invalid UUID', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    presentStudentIds: ['invalid-uuid']
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each present student ID must be a valid UUID');
            });

            test('should return 400 if absentStudentIds contains invalid UUID', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    absentStudentIds: ['invalid-uuid']
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each absent student ID must be a valid UUID');
            });

            test('should return 400 if student ID is in both present and absent arrays', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    presentStudentIds: [student1.id, student2.id],
                    absentStudentIds: [student1.id, student3.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('in both present and absent lists');
            });
        });

        describe('Success Cases', () => {
            test('should add students attendance successfully with admin token', async () => {
                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(validAttendanceData());

                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('added successfully');
                expect(response.body.data).toBe(null);

                const attendanceStudents = await AttendanceStudent.findAll({
                    where: {
                        attendanceId: attendance.id
                    }
                });
                expect(attendanceStudents).toHaveLength(3);

                const presentStudents = attendanceStudents.filter((as) => as.attendanceStatus === true);
                expect(presentStudents).toHaveLength(2);
                expect(presentStudents.map((ps) => ps.studentId)).toContain(student1.id);
                expect(presentStudents.map((ps) => ps.studentId)).toContain(student2.id);

                const absentStudents = attendanceStudents.filter((as) => as.attendanceStatus === false);
                expect(absentStudents).toHaveLength(1);
                expect(absentStudents[0].studentId).toBe(student3.id);
            });

            test('should add students attendance successfully with teacher token', async () => {
                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${teacherToken}`).
                send(validAttendanceData());
                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('added successfully');
                expect(response.body.data).toBe(null);
            });

            test('should handle empty present students array', async () => {
                const data = {
                    attendanceId: attendance.id,
                    presentStudentIds: [],
                    absentStudentIds: [student1.id, student2.id, student3.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(data);
                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBe(null);
            });

            test('should handle empty absent students array', async () => {
                const data = {
                    attendanceId: attendance.id,
                    presentStudentIds: [student1.id, student2.id, student3.id],
                    absentStudentIds: []
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(data);
                expect(response.status).toBe(httpStatus.CREATED);
                expect(response.body.success).toBe(true);
                expect(response.body.data).toBe(null);
            });

            test('should return 404 if attendance does not exist', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    attendanceId: faker.string.uuid()
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance not found');
            });

            test('should return 404 if student does not exist', async () => {
                const invalidData = {
                    ...validAttendanceData(),
                    presentStudentIds: [faker.string.uuid(), faker.string.uuid()],
                    absentStudentIds: [student3.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('One or more student IDs are invalid');
            });

            test('should return 409 if students already have attendance for this session', async () => {

                await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(validAttendanceData());

                const response = await request(app).
                post('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(validAttendanceData());
                expect(response.status).toBe(httpStatus.CONFLICT);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('already added');
            });
        });
    });
});
