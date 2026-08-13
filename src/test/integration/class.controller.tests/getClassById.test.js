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

describe('Class API - getClassById', () => {
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
            roomId: room101.id,
            batchId: batchA.id,
            activeFrom: '2025-09-01',
            activeTill: '2025-11-30',
            classType: 'Practical',
            courseId: coursePF.id,
            timetableId: timetable.id,
            isExtraClass: false
        });
    });

    describe('Authentication', () => {
        test('should return 401 if no token provided', async () => {
            const res = await request(app).get(`/api/v1/classes/${classLecture.id}`);
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('No token provided');
        });

        test('should return 401 if invalid token provided', async () => {
            const res = await request(app).
            get(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', 'Bearer invalidtoken');
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Invalid token');
        });

        test('should allow admin, teacher, and student to fetch', async () => {
            const asAdmin = await request(app).
            get(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`);
            expect(asAdmin.status).toBe(httpStatus.OK);

            const asTeacher = await request(app).
            get(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${teacherToken}`);
            expect(asTeacher.status).toBe(httpStatus.OK);

            const asStudent = await request(app).
            get(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${studentToken}`);
            expect(asStudent.status).toBe(httpStatus.OK);
        });
    });

    describe('Validation', () => {
        test('should return 400 if id is not a valid UUID', async () => {
            const res = await request(app).
            get('/api/v1/classes/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class ID must be a valid UUID');
        });
    });

    describe('Success cases', () => {
        test('should fetch lecture class with nested associations; Batch should be null', async () => {
            const res = await request(app).
            get(`/api/v1/classes/${classLecture.id}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('Class fetched successfully');

            const cls = res.body.data;

            expect(cls.id).toBe(classLecture.id);
            expect(cls.teacherId).toBe(teacherJohn.id);
            expect(cls.courseId).toBe(coursePF.id);
            expect(cls.timetableId).toBe(timetable.id);

            expect(cls.Course).toBeDefined();
            expect(cls.Course.id).toBe(coursePF.id);

            expect(cls.Teacher).toBeDefined();
            expect(cls.Teacher.id).toBe(teacherJohn.id);

            expect(cls.Timetable).toBeDefined();
            expect(cls.Timetable.id).toBe(timetable.id);
            expect(cls.Timetable.Division).toBeDefined();
            expect(cls.Timetable.Division.id).toBe(division.id);
            expect(cls.Timetable.Division.Semester).toBeDefined();
            expect(cls.Timetable.Division.Semester.id).toBe(semester.id);
            expect(cls.Timetable.Division.Semester.Branch).toBeDefined();
            expect(cls.Timetable.Division.Semester.Branch.id).toBe(branch.id);

            expect(cls.Batch).toBeNull();
        });

        test('should fetch practical class with Batch populated', async () => {
            const res = await request(app).
            get(`/api/v1/classes/${classPractical.id}`).
            set('Authorization', `Bearer ${teacherToken}`);

            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);

            const cls = res.body.data;
            expect(cls.id).toBe(classPractical.id);
            expect(cls.Batch).toBeDefined();
            expect(cls.Batch.id).toBe(batchA.id);
        });
    });

    describe('Not Found', () => {
        test('should return 404 if class does not exist', async () => {

            const fakeId = '550e8400-e29b-41d4-a716-446655440000';
            const res = await request(app).
            get(`/api/v1/classes/${fakeId}`).
            set('Authorization', `Bearer ${studentToken}`);

            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Class not found');
        });
    });
});
