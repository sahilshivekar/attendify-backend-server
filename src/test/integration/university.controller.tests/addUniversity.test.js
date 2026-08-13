import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('University API - POST /api/v1/universities', () => {
    let adminToken;
    let teacherToken;

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
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).post('/api/v1/universities').send({
            name: 'New University',
            abbreviation: 'NU'
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for non-admin (teacher)', async () => {
        const res = await request(app).
        post('/api/v1/universities').
        set('Authorization', `Bearer ${teacherToken}`).
        send({
            name: 'New University',
            abbreviation: 'NU'
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for missing name', async () => {
        const res = await request(app).
        post('/api/v1/universities').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            abbreviation: 'NU'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('University name is required');
    });

    test('should return 400 for long abbreviation', async () => {
        const res = await request(app).
        post('/api/v1/universities').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'Valid Name',
            abbreviation: 'THIS-IS-TOO-LONG-OVER-20-CHARS'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Abbreviation cannot exceed 20 characters');
    });

    test('should create university successfully', async () => {
        const res = await request(app).
        post('/api/v1/universities').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'City University',
            abbreviation: 'CU'
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('name', 'City University');
    });
});
