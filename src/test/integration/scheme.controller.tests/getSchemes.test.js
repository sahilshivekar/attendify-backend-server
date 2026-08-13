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

setupTestDb();

describe('Scheme API - GET /api/v1/schemes', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let schemes;

    beforeEach(async () => {
        try {

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

            await Teacher.create({
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

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });

            schemes = await Scheme.bulkCreate([{
                    name: 'Computer Science 2026',
                    universityId: university.id
                },
                {
                    name: 'Electronics 2025',
                    universityId: university.id
                },
                {
                    name: 'Mechanical 2023',
                    universityId: university.id
                }
            ], {
                returning: true
            });

            await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: schemes[0].id,
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
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/api/v1/schemes');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 401 when invalid token is provided', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        set('Authorization', 'Bearer invalidtoken');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should list schemes for Admin', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(3);
    });

    test('should list schemes for Teacher', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        set('Authorization', `Bearer ${teacherToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(3);
    });

    test('should list schemes for Student', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        set('Authorization', `Bearer ${studentToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(3);
    });

    test('should filter by searchQuery (case-insensitive)', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        query({
            searchQuery: 'electronics'
        }).
        set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].name).toMatch(/Electronics 2025/i);
    });

    test('should return empty array when no schemes match searchQuery', async () => {
        const res = await request(app).
        get('/api/v1/schemes').
        query({
            searchQuery: 'biology'
        }).
        set('Authorization', `Bearer ${adminToken}`);

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveLength(0);
    });
});
