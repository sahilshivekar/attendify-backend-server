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
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';
import {
    ROLES
} from '../../../config/roles.js';

setupTestDb();

describe('Attendance API - updateStudentAttendance', () => {
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
    let attendance;
    let attendanceStudent1;
    let attendanceStudent2;

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
            phoneNumber: '9876543210',
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
            phoneNumber: '9876543211',
            prn: 'STU002',
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
            date: '2025-01-15'
        });

        attendanceStudent1 = await AttendanceStudent.create({
            attendanceId: attendance.id,
            studentId: student1.id,
            attendanceStatus: true
        });

        attendanceStudent2 = await AttendanceStudent.create({
            attendanceId: attendance.id,
            studentId: student2.id,
            attendanceStatus: false
        });
    });

    describe('PUT /api/v1/attendances/students', () => {
        const validUpdateData = () => ({
            attendanceId: attendance.id,
            studentId: student1.id,
            newAttendanceStatus: false
        });

        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                put('/api/v1/attendances/students').
                send(validUpdateData());

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', 'Bearer invalidtoken').
                send(validUpdateData());

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to update attendance', async () => {
                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${studentToken}`).
                send(validUpdateData());

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });
        });

        describe('Validation', () => {
            test('should return 400 if attendanceId is missing', async () => {
                const invalidData = {
                    ...validUpdateData()
                };
                delete invalidData.attendanceId;

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance ID is required');
            });

            test('should return 400 if attendanceId is not a valid UUID', async () => {
                const invalidData = {
                    ...validUpdateData(),
                    attendanceId: 'invalid-uuid'
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance ID must be a valid UUID');
            });

            test('should return 400 if studentId is missing', async () => {
                const invalidData = {
                    ...validUpdateData()
                };
                delete invalidData.studentId;

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student ID is required');
            });

            test('should return 400 if studentId is not a valid UUID', async () => {
                const invalidData = {
                    ...validUpdateData(),
                    studentId: 'invalid-uuid'
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student ID must be a valid UUID');
            });

            test('should return 400 if newAttendanceStatus is missing', async () => {
                const invalidData = {
                    ...validUpdateData()
                };
                delete invalidData.newAttendanceStatus;

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('New attendance status is required');
            });

            test('should return 400 if newAttendanceStatus is not a boolean', async () => {
                const invalidData = {
                    ...validUpdateData(),
                    newAttendanceStatus: 'invalid'
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('New attendance status must be a boolean');
            });
        });

        describe('Success Cases', () => {
            test('should update student attendance from present to absent successfully with admin token', async () => {
                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(validUpdateData());

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('updated successfully');
                expect(response.body.data).toHaveProperty('id');
                expect(response.body.data.attendanceStatus).toBe(false);

                const updatedAttendance = await AttendanceStudent.findOne({
                    where: {
                        attendanceId: attendance.id,
                        studentId: student1.id
                    }
                });
                expect(updatedAttendance).toBeTruthy();
                expect(updatedAttendance.attendanceStatus).toBe(false);
            });

            test('should update student attendance from absent to present successfully with teacher token', async () => {
                const updateData = {
                    attendanceId: attendance.id,
                    studentId: student2.id,
                    newAttendanceStatus: true
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${teacherToken}`).
                send(updateData);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('updated successfully');
                expect(response.body.data.attendanceStatus).toBe(true);

                const updatedAttendance = await AttendanceStudent.findOne({
                    where: {
                        attendanceId: attendance.id,
                        studentId: student2.id
                    }
                });
                expect(updatedAttendance).toBeTruthy();
                expect(updatedAttendance.attendanceStatus).toBe(true);
            });

            test('should give 400 if the new attendance status is the same as the current status', async () => {
                const updateData = {
                    attendanceId: attendance.id,
                    studentId: student1.id,
                    newAttendanceStatus: true
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(updateData);

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('New attendance status is same as old attendance status');

                const updatedAttendance = await AttendanceStudent.findOne({
                    where: {
                        attendanceId: attendance.id,
                        studentId: student1.id
                    }
                });
                expect(updatedAttendance).toBeTruthy();
                expect(updatedAttendance.attendanceStatus).toBe(true);
            });

            test('should return 404 if attendance does not exist', async () => {
                const invalidData = {
                    ...validUpdateData(),
                    attendanceId: faker.string.uuid()
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance not found');
            });

            test('should return 404 if student does not exist', async () => {
                const invalidData = {
                    ...validUpdateData(),
                    studentId: faker.string.uuid()
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance of this student not found');
            });

            test('should return 404 if student attendance record does not exist', async () => {

                const newStudent = await Student.create({
                    firstName: 'Charlie',
                    lastName: 'Brown',
                    email: 'charlie@example.com',
                    phoneNumber: '9876543213',
                    prn: 'STU003',
                    password: 'Student@123',
                    schemeId: scheme.id,
                    branchId: branch.id,
                    admissionYear: 2025,
                    admissionType: 'FE',
                    gender: 'Male'
                });

                const invalidData = {
                    ...validUpdateData(),
                    studentId: newStudent.id
                };

                const response = await request(app).
                put('/api/v1/attendances/students').
                set('Authorization', `Bearer ${adminToken}`).
                send(invalidData);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Attendance of this student not found');
            });
        });
    });
});
