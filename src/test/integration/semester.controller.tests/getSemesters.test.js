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

setupTestDb();

describe('Semester API - GET /api/v1/semesters', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;

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

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            scheme = await Scheme.create({
                name: 'CS 2026',
                universityId: university.id
            });

            await Student.create({
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
            const studentLoginRes = await request(app).post('/api/v1/auth/students/login').send({
                emailOrPRN: 'student1@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;

            await Semester.create({
                branchId: branch.id,
                schemeId: scheme.id,
                semesterNumber: 1,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2025-08-01',
                endDate: '2026-01-01'
            });
            await Semester.create({
                branchId: branch.id,
                schemeId: scheme.id,
                semesterNumber: 2,
                academicStartYear: 2025,
                academicEndYear: 2026,
                startDate: '2026-01-15',
                endDate: '2026-06-01'
            });
            await Semester.create({
                branchId: branch.id,
                schemeId: scheme.id,
                semesterNumber: 3,
                academicStartYear: 2026,
                academicEndYear: 2026,
                startDate: '2026-08-01',
                endDate: '2026-01-01'
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/api/v1/semesters');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).get('/api/v1/semesters').set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should list semesters for Admin with pagination metadata', async () => {
        const res = await request(app).get('/api/v1/semesters').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data.semesters)).toBe(true);
        expect(typeof res.body.data.totalCount).toBe('number');
        expect(res.body.data.totalCount).toBe(3);
    });

    test('should list semesters for Teacher', async () => {
        const res = await request(app).get('/api/v1/semesters').set('Authorization', `Bearer ${teacherToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
    });

    test('should list semesters for Student', async () => {
        const res = await request(app).get('/api/v1/semesters').set('Authorization', `Bearer ${studentToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
    });

    test('should filter by semesterNumber', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            semesterNumber: 2
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(1);
        expect(res.body.data.semesters[0].semesterNumber).toBe(2);
    });

    test('should filter by academicStartYear and academicEndYear', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            academicStartYear: 2026,
            academicEndYear: 2026
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(1);
        expect(res.body.data.semesters[0].academicStartYear).toBe(2026);
    });

    test('should filter by branchId and schemeId', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            branchId: branch.id,
            schemeId: scheme.id
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(3);
    });

    test('should respect pagination limit and page', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            page: 2,
            limit: 1
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.semesters).toHaveLength(1);
        expect(res.body.data.totalCount).toBe(3);
    });

    test('should return all without pagination when getAll=true', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            getAll: true
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.semesters.length).toBe(3);
    });

    test('should filter by isEven=true', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            isEven: true,
            isOdd: false
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(1);
        expect(res.body.data.semesters[0].semesterNumber).toBe(2);
    });

    test('should filter by isOdd=true', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            isOdd: true,
            isEven: false
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(2);
        const semesterNumbers = res.body.data.semesters.map((s) => s.semesterNumber).sort();
        expect(semesterNumbers).toEqual([1, 3]);
    });

    test('should return all when both isEven and isOdd are true', async () => {
        const res = await request(app).
        get('/api/v1/semesters').
        query({
            isEven: true,
            isOdd: true
        }).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.totalCount).toBe(3);
    });
});
