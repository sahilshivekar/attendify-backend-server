import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
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
import CancelledClass from '../../../db/models/cancelledClass.model.js';
import StudentDivision from '../../../db/models/studentDivision.model.js';
import StudentBatch from '../../../db/models/studentBatch.model.js';

setupTestDb();

describe('Class API - cancelClass', () => {
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
    let student2;
    let student3;
    let classLecture;
    let classPractical;

    beforeEach(async () => {

        await Admin.create({
            email: 'admin@example.com',
            username: 'adminuser',
            password: 'Admin@12345'
        });
        const adminLogin = await request(app).post('/api/v1/auth/admins/login').send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        adminToken = adminLogin.body.data.accessToken;

        teacher = await Teacher.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'teacher@example.com',
            phoneNumber: '+911234567890',
            password: 'Teacher@123',
            gender: 'Male',
            role: 'Teacher'
        });
        const teacherLogin = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'teacher@example.com',
            password: 'Teacher@123'
        });
        teacherToken = teacherLogin.body.data.accessToken;

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
            batchCode: 'Batch A',
            divisionId: division.id
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
            gender: 'Female'
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
            gender: 'Female'
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

        const studentLogin = await request(app).post('/api/v1/auth/students/login').send({
            emailOrPRN: 'student1@example.com',
            password: 'Student@123'
        });
        studentToken = studentLogin.body.data.accessToken;

        classLecture = await Class.create({
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
            timetableId: timetable.id,
            isExtraClass: false
        });

        classPractical = await Class.create({
            teacherId: teacher.id,
            startTime: '10:00:00',
            endTime: '11:00:00',
            dayOfWeek: 'Monday',
            roomId: room.id,
            batchId: batch.id,
            activeFrom: '2025-08-01',
            activeTill: '2025-12-31',
            classType: 'Practical',
            courseId: course.id,
            timetableId: timetable.id,
            isExtraClass: false
        });
    });

    const url = '/api/v1/classes/cancelled';

    describe('Authentication and Authorization', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).post(url).send({
                classId: classLecture.id,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', 'Bearer invalidtoken').
            send({
                classId: classLecture.id,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should return 403 if student tries to cancel', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${studentToken}`).
            send({
                classId: classLecture.id,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });

        test('should allow admin to cancel', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class marked as cancelled successfully');

            const record = await CancelledClass.findOne({
                where: {
                    classId: classLecture.id,
                    date: '2025-09-01'
                }
            });
            expect(record).toBeTruthy();
        });

        test('should allow teacher to cancel', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                classId: classPractical.id,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class marked as cancelled successfully');

            const record = await CancelledClass.findOne({
                where: {
                    classId: classPractical.id,
                    date: '2025-09-01'
                }
            });
            expect(record).toBeTruthy();
        });
    });

    describe('Validation', () => {
        test('should return 400 if classId is missing', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class ID is required');
        });

        test('should return 400 if classId is not a valid UUID', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: 'invalid-uuid',
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class ID must be a valid UUID');
        });

        test('should return 400 if date is missing', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Date is required');
        });
    });

    describe('Not Found', () => {
        test('should return 404 if class does not exist', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: fakeId,
                date: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class not found');
        });
    });

    describe('Date bounds and duplicates', () => {
        test('should return 400 if date is before activeFrom', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2025-07-31'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('not in bounds');
        });

        test('should return 400 if date is after activeTill', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2026-01-01'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('not in bounds');
        });

        test('should return 409 if class is already cancelled on that date', async () => {

            await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2025-09-02'
            });

            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2025-09-02'
            });
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('already cancelled');
        });
    });

    describe('Notification paths (smoke)', () => {
        test('should cancel lecture (division notification path)', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classLecture.id,
                date: '2025-09-03'
            });
            expect(res.status).toBe(httpStatus.OK);
            const record = await CancelledClass.findOne({
                where: {
                    classId: classLecture.id,
                    date: '2025-09-03'
                }
            });
            expect(record).toBeTruthy();
        });

        test('should cancel practical (batch notification path)', async () => {
            const res = await request(app).
            post(url).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                classId: classPractical.id,
                date: '2025-09-04'
            });
            expect(res.status).toBe(httpStatus.OK);
            const record = await CancelledClass.findOne({
                where: {
                    classId: classPractical.id,
                    date: '2025-09-04'
                }
            });
            expect(record).toBeTruthy();
        });
    });
});
