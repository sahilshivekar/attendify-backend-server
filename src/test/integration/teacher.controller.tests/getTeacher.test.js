import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Course from '../../../db/models/course.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import TeacherTeachesCourse from '../../../db/models/teacherTeachesCourse.model.js';
import University from '../../../db/models/university.model.js';

setupTestDb();

describe('Teacher API - GET /api/v1/teachers', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let teacher1;
    let teacher2;
    let course1;
    let course2;

    beforeEach(async () => {
        try {

            await Admin.create({
                email: 'admin@example.com',
                username: 'adminuser',
                password: 'Admin@12345'
            });
            const adminLoginRes = await request(app).post('/api/v1/auth/admins/login').send({
                emailOrUsername: 'admin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).post('/api/v1/auth/teachers/login').send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;

            teacher1 = await Teacher.create({
                firstName: 'Alice',
                lastName: 'Anderson',
                email: 'alice@example.com',
                phoneNumber: '+911111111111',
                password: 'Teacher@123',
                gender: 'Female',
                role: 'Teacher',
                highestQualification: 'M.Tech'
            });
            teacher2 = await Teacher.create({
                firstName: 'Bob',
                lastName: 'Brown',
                email: 'bob@example.com',
                phoneNumber: '+912222222222',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Head of Department',
                highestQualification: 'PhD'
            });

            const university = await University.create({
                name: 'Tech University',
                abbreviation: 'TU'
            });
            const scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });
            course1 = await Course.create({
                name: 'Algorithms',
                code: 'CS201',
                schemeId: scheme.id
            });
            course2 = await Course.create({
                name: 'Databases',
                code: 'CS202',
                schemeId: scheme.id
            });

            await TeacherTeachesCourse.create({
                teacherId: teacher1.id,
                courseId: course1.id
            });
            await TeacherTeachesCourse.create({
                teacherId: teacher2.id,
                courseId: course2.id
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/api/v1/teachers');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).get('/api/v1/teachers').set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should allow Admin/Teacher to list teachers', async () => {
        for (const token of [adminToken, teacherToken]) {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${token}`);
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.success).toBe(true);
            expect(res.body.data).toHaveProperty('teacher');
            expect(res.body.data).toHaveProperty('totalTeacher');
            expect(Array.isArray(res.body.data.teacher)).toBe(true);

            const emails = res.body.data.teacher.map((t) => t.email).sort();
            expect(emails).toEqual(expect.arrayContaining(['alice@example.com', 'bob@example.com', 'teacher@example.com']));
        }
    });

    describe('Validation errors', () => {
        test('should return 400 for invalid page', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                page: 'zero'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Page must be a number');
        });

        test('should return 400 for invalid limit', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                limit: 'many'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Limit must be a number');
        });

        test('should return 400 for invalid courseId', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                courseId: 'not-a-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Course ID must be a valid UUID');
        });

        test('should return 400 for invalid getAll', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                getAll: 'yes'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('getAll must be a boolean');
        });
    });

    describe('Filtering and pagination', () => {
        test('should filter by searchQuery across name/email/phone', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                searchQuery: 'Alice'
            });
            expect(res.status).toBe(httpStatus.OK);
            const {
                teacher,
                totalTeacher
            } = res.body.data;
            expect(totalTeacher).toBeGreaterThanOrEqual(1);
            expect(teacher.some((t) => t.email === 'alice@example.com')).toBe(true);
        });

        test('should filter by courseId and include related Course', async () => {
            const res = await request(app).
            get('/api/v1/teachers').
            set('Authorization', `Bearer ${adminToken}`).
            query({
                courseId: course1.id
            });
            expect(res.status).toBe(httpStatus.OK);
            const {
                teacher,
                totalTeacher
            } = res.body.data;

            expect(totalTeacher).toBe(1);
            expect(teacher[0].email).toBe('alice@example.com');

            expect(teacher[0]).toHaveProperty('TeacherTeachesCourses');
            const ttc = teacher[0].TeacherTeachesCourses[0];
            expect(ttc).toHaveProperty('Course');
            expect(ttc.Course).toHaveProperty('name', 'Algorithms');
        });

        test('should paginate results with page and limit', async () => {
            const resPage1 = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                page: 1,
                limit: 2
            });
            expect(resPage1.status).toBe(httpStatus.OK);
            expect(resPage1.body.data.teacher.length).toBeLessThanOrEqual(2);
            const resPage2 = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                page: 2,
                limit: 2
            });
            expect(resPage2.status).toBe(httpStatus.OK);
        });

        test('should return all results when getAll=true (no pagination)', async () => {
            const res = await request(app).get('/api/v1/teachers').set('Authorization', `Bearer ${adminToken}`).query({
                getAll: true
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.teacher.length).toBeGreaterThanOrEqual(3);
        });
    });
});
