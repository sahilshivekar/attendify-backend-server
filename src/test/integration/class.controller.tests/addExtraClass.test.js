import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import {
    faker
} from '@faker-js/faker';
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
import BranchCourseSemester from '../../../db/models/branchCourseSemester.model.js';

setupTestDb();

describe('Class API - addExtraClass', () => {
    let adminToken;
    let teacherToken;
    let studentToken;

    let university;
    let branch;
    let scheme;
    let semester;
    let division;
    let batchA;
    let batchB;
    let coursePF;
    let room101;
    let room102;
    let timetable;
    let teacherJohn;
    let teacherJane;

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

        teacherJane = await Teacher.create({
            firstName: 'Jane',
            lastName: 'Roe',
            email: 'teacher2@example.com',
            phoneNumber: '+911234567891',
            password: 'Teacher2@123',
            gender: 'Female',
            role: 'Teacher'
        });

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
        batchB = await Batch.create({
            batchCode: 'Batch B',
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

        await BranchCourseSemester.create({
            courseId: coursePF.id,
            semesterNumber: semester.semesterNumber,
            branchId: branch.id
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
    });

    const validLecturePayload = () => ({
        teacherId: teacherJohn.id,
        startTime: '09:00:00',
        endTime: '10:00:00',
        dayOfWeek: 'Monday',
        roomId: room101.id,
        batchId: null,
        activeFrom: '2025-09-01',
        activeTill: '2025-11-30',
        classType: 'Lecture',
        courseId: coursePF.id,
        timetableId: timetable.id
    });

    const validPracticalPayload = () => ({
        teacherId: teacherJohn.id,
        startTime: '10:00:00',
        endTime: '11:00:00',
        dayOfWeek: 'Monday',
        roomId: room102.id,
        batchId: batchA.id,
        activeFrom: '2025-09-01',
        activeTill: '2025-11-30',
        classType: 'Practical',
        courseId: coursePF.id,
        timetableId: timetable.id
    });

    describe('Authentication and Authorization', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).
            post('/api/v1/classes/extra').
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', 'Bearer invalidtoken').
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should return 403 if student tries to add extra class', async () => {
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${studentToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Insufficient permissions');
        });

        test('should allow admin to add extra class', async () => {
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class added successfully');
            expect(res.body.data.isExtraClass).toBe(true);
        });

        test('should allow teacher to add extra class', async () => {
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${teacherToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.success).toBe(true);
            expect(res.body.data.isExtraClass).toBe(true);
        });
    });

    describe('Validation', () => {
        test('should return 400 if startTime is invalid format', async () => {
            const payload = {
                ...validLecturePayload(),
                startTime: '9:00'
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Start time must be in HH:mm:ss format');
        });

        test('should return 400 if teacherId is missing', async () => {
            const payload = {
                ...validLecturePayload()
            };
            delete payload.teacherId;
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Teacher ID is required');
        });

        test("should return 400 if classType isn't allowed", async () => {
            const payload = {
                ...validLecturePayload(),
                classType: 'Lab'
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Class type must be 'Lecture', 'Tutorial' or 'Practical'");
        });
    });

    describe('Not Found checks', () => {
        test('should return 404 if teacher does not exist', async () => {
            const payload = {
                ...validLecturePayload(),
                teacherId: faker.string.uuid()
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Teacher not found');
        });

        test('should return 404 if course does not exist', async () => {
            const payload = {
                ...validLecturePayload(),
                courseId: faker.string.uuid()
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Course not found');
        });

        test('should return 404 if room does not exist', async () => {
            const payload = {
                ...validLecturePayload(),
                roomId: faker.string.uuid()
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Room not found');
        });

        test('should return 404 if timetable does not exist', async () => {
            const payload = {
                ...validLecturePayload(),
                timetableId: faker.string.uuid()
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Timetable not found');
        });

        test('should return 404 if batch does not exist for practical', async () => {
            const payload = {
                ...validPracticalPayload(),
                batchId: faker.string.uuid()
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Batch not found');
        });
    });

    describe('Batch and date validations', () => {
        test("should return 400 if batch doesn't belong to division of timetable", async () => {

            const division2 = await Division.create({
                divisionCode: 'B',
                semesterId: semester.id
            });
            const batchC = await Batch.create({
                batchCode: 'Batch C',
                divisionId: division2.id
            });

            const payload = {
                ...validPracticalPayload(),
                batchId: batchC.id
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Batch doesn't belong to the same division as the timetable");
        });

        test('should return 400 if activeFrom is out of semester bounds', async () => {
            const payload = {
                ...validLecturePayload(),
                activeFrom: '2025-07-31'
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Active from date is out of bounds');
        });

        test('should return 400 if activeTill is out of semester bounds', async () => {
            const payload = {
                ...validLecturePayload(),
                activeTill: '2026-01-01'
            };
            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(payload);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Active till date is out of bounds');
        });
    });

    describe('Conflict checks', () => {
        test('should return 409 for teacher conflict (extra class)', async () => {

            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '09:30:00',
                endTime: '10:30:00',
                dayOfWeek: 'Monday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-09-10',
                activeTill: '2025-12-01',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: true
            });

            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Teacher unavailable at this time');
        });

        test('should return 409 for room conflict (extra class)', async () => {

            await Class.create({
                teacherId: teacherJane.id,
                startTime: '09:30:00',
                endTime: '10:30:00',
                dayOfWeek: 'Monday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-09-10',
                activeTill: '2025-12-01',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: true
            });

            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Room unavailable at this time');
        });

        test("should return 409 for division conflict when lecture's slot collides (extra class)", async () => {

            await Class.create({
                teacherId: teacherJane.id,
                startTime: '09:30:00',
                endTime: '10:30:00',
                dayOfWeek: 'Monday',
                roomId: room102.id,
                batchId: null,
                activeFrom: '2025-09-10',
                activeTill: '2025-12-01',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: true
            });

            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(validLecturePayload());
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Time slot isn't free");
        });

        test('should return 409 for batch conflict when practical collides with existing extra lecture', async () => {

            await Class.create({
                teacherId: teacherJane.id,
                startTime: '10:15:00',
                endTime: '11:15:00',
                dayOfWeek: 'Monday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-09-10',
                activeTill: '2025-12-01',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: true
            });

            const res = await request(app).
            post('/api/v1/classes/extra').
            set('Authorization', `Bearer ${adminToken}`).
            send(validPracticalPayload());
            expect(res.status).toBe(httpStatus.CONFLICT);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain("Time slot isn't free");
        });
    });
});
