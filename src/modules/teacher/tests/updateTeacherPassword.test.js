import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('Teacher API - PUT /api/v1/teachers/password', () => {
    let adminToken;
    let teacher;

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

            teacher = await Teacher.create({
                firstName: 'Penny',
                lastName: 'Lane',
                email: 'penny@example.com',
                phoneNumber: '+911234500010',
                password: 'Teacher@123',
                gender: 'Female',
                role: 'Teacher'
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).put('/api/v1/teachers/password').send({
            id: teacher.id,
            password: 'NewPass@123',
            confirmPassword: 'NewPass@123'
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for teacher token (admin only)', async () => {
        const tLogin = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'penny@example.com',
            password: 'Teacher@123'
        });
        const teacherToken = tLogin.body.data.accessToken;
        const res = await request(app).
        put('/api/v1/teachers/password').
        set('Authorization', `Bearer ${teacherToken}`).
        send({
            id: teacher.id,
            password: 'NewPass@123',
            confirmPassword: 'NewPass@123'
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for validation errors (mismatch confirm)', async () => {
        const res = await request(app).
        put('/api/v1/teachers/password').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            id: teacher.id,
            password: 'NewPass@123',
            confirmPassword: 'Mismatch'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Password and confirm password must match');
    });

    test('should return 404 when teacher not found', async () => {
        const res = await request(app).
        put('/api/v1/teachers/password').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
            password: 'NewPass@123',
            confirmPassword: 'NewPass@123'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');
    });

    test('should update password and allow login with new password', async () => {
        const res = await request(app).
        put('/api/v1/teachers/password').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            id: teacher.id,
            password: 'NewPass@123',
            confirmPassword: 'NewPass@123'
        });
        expect(res.status).toBe(httpStatus.OK);

        const loginRes = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'penny@example.com',
            password: 'NewPass@123'
        });
        expect(loginRes.status).toBe(httpStatus.OK);
        expect(loginRes.body.data).toHaveProperty('accessToken');
    });
});
