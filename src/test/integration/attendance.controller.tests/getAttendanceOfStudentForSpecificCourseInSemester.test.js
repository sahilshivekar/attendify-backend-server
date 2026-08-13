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
import httpStatus from 'http-status';

setupTestDb();

describe('Attendance API - getAttendanceOfStudentForSpecificCourseInSemester', () => {
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
    let attendance1;
    let attendance2;

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

        attendance1 = await Attendance.create({
            classId: classEntity.id,
            date: '2025-01-15'
        });

        attendance2 = await Attendance.create({
            classId: classEntity.id,
            date: '2025-01-22'
        });

        await AttendanceStudent.create({
            attendanceId: attendance1.id,
            studentId: student1.id,
            attendanceStatus: true
        });

        await AttendanceStudent.create({
            attendanceId: attendance1.id,
            studentId: student2.id,
            attendanceStatus: false
        });

        await AttendanceStudent.create({
            attendanceId: attendance2.id,
            studentId: student1.id,
            attendanceStatus: false
        });

        await AttendanceStudent.create({
            attendanceId: attendance2.id,
            studentId: student2.id,
            attendanceStatus: true
        });
    });

    describe('GET /api/v1/attendances/student', () => {
        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    semesterId: semester.id
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', 'Bearer invalidtoken').
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    semesterId: semester.id
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid token');
            });

            test('should return 403 if student tries to access', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${studentToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });
        });

        describe('Validation', () => {
            test('should return 400 if studentId is missing', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    courseId: course.id
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student ID is required');
            });

            test('should return 400 if courseId is missing', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course ID is required');
            });

            test('should return 400 if studentId is not a valid UUID', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: 'invalid-uuid',
                    courseId: course.id
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student ID must be a valid UUID');
            });

            test('should return 400 if courseId is not a valid UUID', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: 'invalid-uuid'
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course ID must be a valid UUID');
            });
        });

        describe('Success Cases', () => {
            test('should get attendance for student in specific course successfully with admin token', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id
                });
                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance fetched successfully');
                expect(response.body.data).toHaveProperty('aggregatedAttendance');
                expect(response.body.data).toHaveProperty('detailedAttendance');

                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
                expect(response.body.data.aggregatedAttendance[0]).toHaveProperty('courseId');
                expect(response.body.data.aggregatedAttendance[0]).toHaveProperty('courseName');
                expect(response.body.data.aggregatedAttendance[0]).toHaveProperty('totalLectures');
                expect(response.body.data.aggregatedAttendance[0]).toHaveProperty('attendedLectures');

                expect(response.body.data.detailedAttendance).toHaveLength(2);
                expect(response.body.data.detailedAttendance[0]).toHaveProperty('attendanceId');
                expect(response.body.data.detailedAttendance[0]).toHaveProperty('date');
                expect(response.body.data.detailedAttendance[0]).toHaveProperty('attendanceStatus');
            });

            test('should get attendance for student in specific course with semester filter', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    semesterId: semester.id
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
            });

            test('should get attendance for student in specific course with division filter', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    divisionId: division.id
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
            });

            test('should get attendance for student in specific course with batch filter', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    batchId: batch.id
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
            });

            test('should get attendance for student in specific course with date range filter', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    startDate: '2025-01-10',
                    endDate: '2025-01-20'
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.detailedAttendance).toHaveLength(1);
                expect(response.body.data.detailedAttendance[0].date).toBe('2025-01-15');
            });

            test('should filter by semesterNumber, academic years, branchId and schemeId', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id,
                    semesterNumber: 1,
                    academicStartYear: 2025,
                    academicEndYear: 2026,
                    branchId: branch.id,
                    schemeId: scheme.id
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
            });

            test('should get attendance for student in specific course successfully with teacher token', async () => {
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${teacherToken}`).
                query({
                    studentId: student1.id,
                    courseId: course.id
                });

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
            });

            test('should return 404 if student does not exist', async () => {
                const fakeStudentId = '123e4567-e89b-12d3-a456-426614174000';
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: fakeStudentId,
                    courseId: course.id
                });

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student not found');
            });

            test('should return 404 if course does not exist', async () => {
                const fakeCourseId = '123e4567-e89b-12d3-a456-426614174000';
                const response = await request(app).
                get('/api/v1/attendances/student').
                set('Authorization', `Bearer ${adminToken}`).
                query({
                    studentId: student1.id,
                    courseId: fakeCourseId
                });

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course not found');
            });
        });
    });

    describe('GET /api/v1/attendances/me', () => {
        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                query({
                    courseId: course.id
                });
                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('No token provided');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', 'Bearer invalidtoken').
                query({
                    courseId: course.id
                });
                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Invalid token');
            });
        });

        describe('Validation', () => {
            test('should return 400 if courseId is missing', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', `Bearer ${studentToken}`).
                query({});
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course ID is required');
            });

            test('should return 400 if courseId is not a valid UUID', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', `Bearer ${studentToken}`).
                query({
                    courseId: 'invalid-uuid'
                });
                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course ID must be a valid UUID');
            });
        });

        describe('Success Cases', () => {
            test('should get attendance for self in specific course successfully', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', `Bearer ${studentToken}`).
                query({
                    courseId: course.id
                });
                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance fetched successfully');
                expect(response.body.data).toHaveProperty('aggregatedAttendance');
                expect(response.body.data).toHaveProperty('detailedAttendance');
                expect(response.body.data.aggregatedAttendance).toHaveLength(1);
                expect(response.body.data.detailedAttendance.length).toBeGreaterThanOrEqual(1);
            });

            test('should get attendance for self in specific course with date range filter', async () => {
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', `Bearer ${studentToken}`).
                query({
                    courseId: course.id,
                    startDate: '2025-01-10',
                    endDate: '2025-01-20'
                });
                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.detailedAttendance).toHaveLength(1);
                expect(response.body.data.detailedAttendance[0].date).toBe('2025-01-15');
            });

            test('should return 404 if course does not exist', async () => {
                const fakeCourseId = '123e4567-e89b-12d3-a456-426614174000';
                const response = await request(app).
                get('/api/v1/attendances/me').
                set('Authorization', `Bearer ${studentToken}`).
                query({
                    courseId: fakeCourseId
                });
                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course not found');
            });
        });
    });
});
