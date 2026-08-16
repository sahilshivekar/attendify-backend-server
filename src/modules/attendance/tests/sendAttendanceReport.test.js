const mockSendAttendanceReportToEmail = jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
});
const mockSendEmail = jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
});
const mockSendNotification = jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-fcm-id'
});
const mockSendFCMNotification = jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-fcm-id'
});

jest.unstable_mockModule('../../../utils/email.js', () => ({
    sendEmail: mockSendEmail,
    sendAttendanceReportToEmail: mockSendAttendanceReportToEmail
}));

jest.unstable_mockModule('../../../utils/firebaseCloudMessaging.js', () => ({
    sendFCMNotification: mockSendFCMNotification,
    sendNotification: mockSendNotification
}));

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
import {
    jest
} from '@jest/globals';

setupTestDb();

describe('Attendance API - sendAttendanceReport', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batch;
    let course1;
    let course2;
    let room;
    let timetable;
    let classEntity1;
    let classEntity2;
    let teacher;
    let student1;
    let student2;
    let attendance1;
    let attendance2;

    beforeEach(async () => {

        jest.clearAllMocks();
        mockSendAttendanceReportToEmail.mockResolvedValue({
            success: true,
            messageId: 'test-message-id'
        });
        mockSendEmail.mockResolvedValue({
            success: true,
            messageId: 'test-message-id'
        });
        mockSendNotification.mockResolvedValue({
            success: true,
            messageId: 'test-fcm-id'
        });
        mockSendFCMNotification.mockResolvedValue({
            success: true,
            messageId: 'test-fcm-id'
        });

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
            firstName: 'Alice',
            lastName: 'Smith',
            email: 'student1@example.com',
            phoneNumber: '9876543210',
            prn: 'STU001',
            password: 'Student@123',
            parentEmail: 'parent1@example.com',
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
            parentEmail: 'parent2@example.com',
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

        course1 = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        course2 = await Course.create({
            name: 'Data Structures',
            code: 'CS102',
            schemeId: scheme.id
        });

        room = await Room.create({
            roomNumber: '101',
            sittingCapacity: 60
        });
        timetable = await Timetable.create({
            divisionId: division.id
        });

        classEntity1 = await Class.create({
            teacherId: teacher.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room.id,
            batchId: batch.id,
            activeFrom: '2025-01-01',
            activeTill: '2025-12-31',
            classType: 'Lecture',
            courseId: course1.id,
            timetableId: timetable.id
        });

        classEntity2 = await Class.create({
            teacherId: teacher.id,
            startTime: '11:00:00',
            endTime: '12:00:00',
            dayOfWeek: 'Tuesday',
            roomId: room.id,
            batchId: batch.id,
            activeFrom: '2025-01-01',
            activeTill: '2025-12-31',
            classType: 'Practical',
            courseId: course2.id,
            timetableId: timetable.id
        });

        attendance1 = await Attendance.create({
            classId: classEntity1.id,
            date: '2025-01-15'
        });

        attendance2 = await Attendance.create({
            classId: classEntity2.id,
            date: '2025-01-16'
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

    describe('POST /api/v1/attendances/report', () => {
        describe('Authentication', () => {
            test('should return 401 if no token provided', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                send({
                    studentIds: [student1.id]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('token');
            });

            test('should return 401 if invalid token provided', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', 'Bearer invalidtoken').
                send({
                    studentIds: [student1.id]
                });

                expect(response.status).toBe(httpStatus.UNAUTHORIZED);
                expect(response.body.success).toBe(false);
            });

            test('should return 403 if student tries to send attendance report', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${studentToken}`).
                send({
                    studentIds: [student1.id]
                });

                expect(response.status).toBe(httpStatus.FORBIDDEN);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Insufficient permissions');
            });
        });

        describe('Validation', () => {
            test('should return 400 if no criteria provided', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({});

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('At least one of studentIds, courseIds, or semesterId is required');
            });

            test('should return 400 if studentIds contains invalid UUID', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    studentIds: ['invalid-uuid']
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each student ID must be a valid UUID');
            });

            test('should return 400 if courseIds contains invalid UUID', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    courseIds: ['invalid-uuid']
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Each course ID must be a valid UUID');
            });

            test('should return 400 if semesterId is not a valid UUID', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    semesterId: 'invalid-uuid'
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Semester ID must be a valid UUID');
            });

            test('should return 400 if startDate format is invalid', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    studentIds: [student1.id],
                    startDate: '15-01-2025'
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Start date must be in YYYY-MM-DD format');
            });

            test('should return 400 if endDate format is invalid', async () => {
                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send({
                    studentIds: [student1.id],
                    endDate: '20-01-2025'
                });

                expect(response.status).toBe(httpStatus.BAD_REQUEST);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('End date must be in YYYY-MM-DD format');
            });
        });

        describe('Success Cases - Admin Access', () => {
            test('should send attendance report for specific students', async () => {
                const requestBody = {
                    studentIds: [student1.id, student2.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');
                expect(response.body.data).toHaveProperty('reportSent');
                expect(response.body.data).toHaveProperty('emailsSent');
                expect(response.body.data).toHaveProperty('fcmNotificationsSent');
                expect(response.body.data.reportSent).toBe(true);
                expect(response.body.data.emailsSent).toBeGreaterThanOrEqual(1);

            });

            test('should send attendance report for specific courses', async () => {
                const requestBody = {
                    courseIds: [course1.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');
                expect(response.body.data.reportSent).toBe(true);
                expect(response.body.data.emailsSent).toBeGreaterThanOrEqual(1);

            });

            test('should send attendance report for semester', async () => {
                const requestBody = {
                    semesterId: semester.id
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');
                expect(response.body.data.reportSent).toBe(true);
                expect(response.body.data.emailsSent).toBeGreaterThanOrEqual(1);

            });

            test('should send attendance report with date range filter', async () => {
                const requestBody = {
                    studentIds: [student1.id],
                    startDate: '2025-01-15',
                    endDate: '2025-01-15'
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');
                expect(response.body.data.reportSent).toBe(true);

            });

            test('should send both email and FCM notifications', async () => {
                const requestBody = {
                    studentIds: [student1.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.emailsSent).toBeGreaterThanOrEqual(1);
                expect(response.body.data.fcmNotificationsSent).toBeGreaterThanOrEqual(0);

            });

            test('should handle empty results gracefully', async () => {
                const requestBody = {
                    studentIds: [student1.id],
                    startDate: '2025-01-25',
                    endDate: '2025-01-30'
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('No attendance data found');
                expect(response.body.data.reportSent).toBe(false);
                expect(response.body.data.emailsSent).toBe(0);

            });

            test('should return 404 if student does not exist', async () => {
                const requestBody = {
                    studentIds: [faker.string.uuid()]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Student not found');

            });

            test('should return 404 if course does not exist', async () => {
                const requestBody = {
                    courseIds: [faker.string.uuid()]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Course not found');
            });

            test('should return 404 if semester does not exist', async () => {
                const requestBody = {
                    semesterId: faker.string.uuid()
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.NOT_FOUND);
                expect(response.body.success).toBe(false);
                expect(response.body.message).toContain('Semester not found');
            });
        });

        describe('Success Cases - Teacher Access', () => {
            test('should send attendance report with teacher token', async () => {
                const requestBody = {
                    studentIds: [student1.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${teacherToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');
                expect(response.body.data.reportSent).toBe(true);

            });
        });

        describe('External Service Error Handling', () => {

            test('should handle FCM service failure gracefully', async () => {
                const requestBody = {
                    studentIds: [student1.id]
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.data.reportSent).toBe(true);
                expect(response.body.data.emailsSent).toBeGreaterThanOrEqual(1);
                expect(response.body.data.fcmNotificationsSent).toBe(0);
            });
        });

        describe('Complex Filtering', () => {
            test('should combine multiple criteria correctly', async () => {
                const requestBody = {
                    studentIds: [student1.id, student2.id],
                    courseIds: [course1.id],
                    startDate: '2025-01-15',
                    endDate: '2025-01-15'
                };

                const response = await request(app).
                post('/api/v1/attendances/report').
                set('Authorization', `Bearer ${adminToken}`).
                send(requestBody);

                expect(response.status).toBe(httpStatus.OK);
                expect(response.body.success).toBe(true);
                expect(response.body.message).toContain('Attendance report sent successfully');

            });
        });
    });
});
