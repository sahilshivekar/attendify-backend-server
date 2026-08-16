import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
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

setupTestDb();

describe('Class API - extendActiveTillDateOfClass', () => {
    let adminToken;
    let teacherToken;
    let studentToken;

    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batchA;
    let coursePF;
    let room101;
    let room102;
    let timetable;
    let teacherJohn;

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

        teacherJohn = await Teacher.create({
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

        batchA = await Batch.create({
            batchCode: 'Batch A',
            divisionId: division.id
        });

        coursePF = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        room101 = await Room.create({
            roomNumber: '101',
            sittingCapacity: 60
        });
        room102 = await Room.create({
            roomNumber: '102',
            sittingCapacity: 40
        });

        timetable = await Timetable.create({
            divisionId: division.id
        });

        const student = await Student.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'student@example.com',
            phoneNumber: '+919876543210',
            prn: 'STU001',
            password: 'Student@123',
            schemeId: scheme.id,
            branchId: branch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: 'Female'
        });
        const studentLogin = await request(app).post('/api/v1/auth/students/login').send({
            emailOrPRN: 'student@example.com',
            password: 'Student@123'
        });
        studentToken = studentLogin.body.data.accessToken;

        classLecture = await Class.create({
            teacherId: teacherJohn.id,
            startTime: '09:00:00',
            endTime: '10:00:00',
            dayOfWeek: 'Monday',
            roomId: room101.id,
            batchId: null,
            activeFrom: '2025-08-01',
            activeTill: '2025-10-31',
            classType: 'Lecture',
            courseId: coursePF.id,
            timetableId: timetable.id,
            isExtraClass: false
        });

        classPractical = await Class.create({
            teacherId: teacherJohn.id,
            startTime: '10:00:00',
            endTime: '11:00:00',
            dayOfWeek: 'Monday',
            roomId: room102.id,
            batchId: batchA.id,
            activeFrom: '2025-08-15',
            activeTill: '2025-10-15',
            classType: 'Practical',
            courseId: coursePF.id,
            timetableId: timetable.id,
            isExtraClass: false
        });
    });

    describe('Authentication and Authorization', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            send({
                newActiveTill: '2025-12-15'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', 'Bearer invalidtoken').
            send({
                newActiveTill: '2025-12-15'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should return 403 if teacher tries to extend', async () => {
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                newActiveTill: '2025-12-15'
            });
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });

        test('should return 403 if student tries to extend', async () => {
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${studentToken}`).
            send({
                newActiveTill: '2025-12-15'
            });
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });
    });

    describe('Validation', () => {
        test('should return 400 if id is not a valid UUID', async () => {
            const res = await request(app).
            put('/api/v1/classes/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: '2025-12-15'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class ID must be a valid UUID');
        });

        test('should return 400 if newActiveTill is missing', async () => {
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({});
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('newActiveTill is required');
        });

    });

    describe('Success', () => {
        test('should extend activeTill successfully for lecture', async () => {
            const newDate = '2025-12-15';
            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: newDate
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class updated successfully');
            expect(res.body.data.activeTill).toBe(newDate);
        });
    });

    describe('Conflict checks', () => {
        test('should return 409 for room conflict', async () => {

            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '09:30:00',
                endTime: '10:30:00',
                dayOfWeek: 'Monday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: false
            });

            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: '2025-12-15'
            });

            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Room unavailable at this time');
        });

        test("should return 409 for division conflict when lecture's slot collides (different room)", async () => {

            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '09:30:00',
                endTime: '10:30:00',
                dayOfWeek: 'Monday',
                roomId: room102.id,
                batchId: null,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: false
            });

            const res = await request(app).
            put(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: '2025-12-15'
            });

            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Time slot isn't free");
        });

        test('should return 409 for batch conflict when practical collides (different room)', async () => {

            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '10:30:00',
                endTime: '11:30:00',
                dayOfWeek: 'Monday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-08-20',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: false
            });

            const res = await request(app).
            put(`/api/v1/classes/${classPractical.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: '2025-12-15'
            });

            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Time slot isn't free");
        });
    });

    describe('Not Found', () => {
        test('should return 404 if class does not exist', async () => {
            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).
            put(`/api/v1/classes/${fakeId}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                newActiveTill: '2025-12-15'
            });

            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class not found');
        });
    });
});
