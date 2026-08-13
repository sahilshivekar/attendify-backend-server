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

setupTestDb();

describe('Class API - getClasses', () => {
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
    let courseDS;
    let room101;
    let room102;
    let timetable;
    let teacherJohn;
    let classLecturePF;
    let classPracticalPF_A;
    let classPracticalPF_B;
    let classExtraLectureDS;

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
        batchB = await Batch.create({
            batchCode: 'Batch B',
            divisionId: division.id
        });

        coursePF = await Course.create({
            name: 'Programming Fundamentals',
            code: 'CS101',
            schemeId: scheme.id
        });
        courseDS = await Course.create({
            name: 'Data Structures',
            code: 'CS201',
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

        classLecturePF = await Class.create({
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

        classPracticalPF_A = await Class.create({
            teacherId: teacherJohn.id,
            startTime: '10:00:00',
            endTime: '11:00:00',
            dayOfWeek: 'Monday',
            roomId: room102.id,
            batchId: batchA.id,
            activeFrom: '2025-08-15',
            activeTill: '2025-12-15',
            classType: 'Practical',
            courseId: coursePF.id,
            timetableId: timetable.id,
            isExtraClass: false
        });

        classPracticalPF_B = await Class.create({
            teacherId: teacherJohn.id,
            startTime: '11:00:00',
            endTime: '12:00:00',
            dayOfWeek: 'Tuesday',
            roomId: room102.id,
            batchId: batchB.id,
            activeFrom: '2025-09-01',
            activeTill: '2025-11-30',
            classType: 'Practical',
            courseId: coursePF.id,
            timetableId: timetable.id,
            isExtraClass: false
        });

        classExtraLectureDS = await Class.create({
            teacherId: teacherJohn.id,
            startTime: '12:00:00',
            endTime: '13:00:00',
            dayOfWeek: 'Wednesday',
            roomId: room101.id,
            batchId: null,
            activeFrom: '2025-09-10',
            activeTill: '2025-09-20',
            classType: 'Lecture',
            courseId: courseDS.id,
            timetableId: timetable.id,
            isExtraClass: true
        });
    });

    describe('Authentication', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).get('/api/v1/classes');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should allow admin, teacher and student', async () => {
            const asAdmin = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`);
            expect(asAdmin.status).toBe(httpStatus.OK);

            const asTeacher = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${teacherToken}`);
            expect(asTeacher.status).toBe(httpStatus.OK);

            const asStudent = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${studentToken}`);
            expect(asStudent.status).toBe(httpStatus.OK);
        });
    });

    describe('Basic retrieval', () => {
        test('should return classes array and totalCount', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('classes');
            expect(res.body.data).toHaveProperty('totalCount');
            expect(Array.isArray(res.body.data.classes)).toBe(true);
            expect(res.body.data.totalCount).toBeGreaterThanOrEqual(4);
        });
    });

    describe('Filters', () => {
        test('should filter by timetableId', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                timetableId: timetable.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeGreaterThanOrEqual(4);
        });

        test('should filter by divisionId via timetable include', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                divisionId: division.id
            });
            expect(res.status).toBe(httpStatus.OK);

            expect(res.body.data.classes.length).toBeGreaterThanOrEqual(4);
        });

        test('should filter by startTime >= provided', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                startTime: '10:00:00'
            });
            expect(res.status).toBe(httpStatus.OK);

            const times = res.body.data.classes.map((c) => c.startTime);
            expect(times.every((t) => t >= '10:00:00')).toBe(true);
        });

        test('should filter by endTime <= provided', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                endTime: '11:00:00'
            });
            expect(res.status).toBe(httpStatus.OK);
            const times = res.body.data.classes.map((c) => c.endTime);
            expect(times.every((t) => t <= '11:00:00')).toBe(true);
        });

        test('should filter by activeFrom >= provided', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                activeFrom: '2025-09-01'
            });
            expect(res.status).toBe(httpStatus.OK);
            const af = res.body.data.classes.map((c) => c.activeFrom);
            expect(af.every((d) => d >= '2025-09-01')).toBe(true);
        });

        test('should filter by activeTill <= provided', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                activeTill: '2025-10-31'
            });
            expect(res.status).toBe(httpStatus.OK);
            const at = res.body.data.classes.map((c) => c.activeTill);
            expect(at.every((d) => d <= '2025-10-31')).toBe(true);
        });

        test('should filter by teacherId', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                teacherId: teacherJohn.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeGreaterThan(0);
        });

        test('should filter by dayOfWeek', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                dayOfWeek: 'Monday'
            });
            expect(res.status).toBe(httpStatus.OK);
            const days = res.body.data.classes.map((c) => c.dayOfWeek);
            expect(days.every((d) => d === 'Monday')).toBe(true);
        });

        test('should filter by roomId', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                roomId: room102.id
            });
            expect(res.status).toBe(httpStatus.OK);
            const rooms = res.body.data.classes.map((c) => c.roomId);
            expect(rooms.every((r) => r === room102.id)).toBe(true);
        });

        test('should filter by batchId', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                batchId: batchA.id
            });
            expect(res.status).toBe(httpStatus.OK);
            const batches = res.body.data.classes.map((c) => c.batchId);
            expect(batches.every((b) => b === batchA.id)).toBe(true);
        });

        test("should filter by classType 'Practical'", async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                classType: 'Practical'
            });
            expect(res.status).toBe(httpStatus.OK);
            const types = res.body.data.classes.map((c) => c.classType);
            expect(types.every((t) => t === 'Practical')).toBe(true);
        });

        test('should filter by courseId (via include Course)', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                courseId: coursePF.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeGreaterThan(0);
            const courses = res.body.data.classes.map((c) => c.Course?.id || c.courseId);
            expect(courses.every((id) => id === coursePF.id)).toBe(true);
        });

        test('should filter by searchQuery (Course.name iLike)', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                searchQuery: 'program'
            });
            expect(res.status).toBe(httpStatus.OK);

            const names = res.body.data.classes.map((c) => c.Course?.name || '');
            expect(names.every((n) => n.toLowerCase().includes('program'))).toBe(true);
        });

        test('should filter by semesterId (via nested include)', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                semesterId: semester.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeGreaterThan(0);
        });

        test('should filter by isExtraClass true strictly', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                isExtraClass: true
            });
            expect(res.status).toBe(httpStatus.OK);

            const extras = res.body.data.classes.map((c) => c.isExtraClass);
            expect(extras.every(Boolean)).toBe(true);
        });
    });

    describe('Pagination', () => {
        test('should respect default limit=10 and page=1', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeLessThanOrEqual(10);
            expect(res.body.data.totalCount).toBeGreaterThanOrEqual(4);
        });

        test('should apply custom page and limit', async () => {

            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '13:00:00',
                endTime: '14:00:00',
                dayOfWeek: 'Thursday',
                roomId: room101.id,
                batchId: null,
                activeFrom: '2025-08-01',
                activeTill: '2025-12-31',
                classType: 'Lecture',
                courseId: coursePF.id,
                timetableId: timetable.id,
                isExtraClass: false
            });
            await Class.create({
                teacherId: teacherJohn.id,
                startTime: '14:00:00',
                endTime: '15:00:00',
                dayOfWeek: 'Friday',
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
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                page: 2,
                limit: 2
            });

            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeLessThanOrEqual(2);
            expect(res.body.data.totalCount).toBeGreaterThanOrEqual(4);
        });

        test('should return all when getAll=true (ignores pagination)', async () => {
            const res = await request(app).
            get('/api/v1/classes').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                getAll: true,
                limit: 1
            });

            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.classes.length).toBeGreaterThanOrEqual(4);
        });
    });
});
