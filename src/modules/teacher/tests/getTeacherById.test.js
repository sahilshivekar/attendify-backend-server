import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('Teacher API - GET /api/v1/teachers/:id', () => {
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
                firstName: 'Jane',
                lastName: 'Doe',
                email: 'jane@example.com',
                phoneNumber: '+911234500000',
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
        const res = await request(app).get(`/api/v1/teachers/${teacher.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 for invalid teacher id (not uuid)', async () => {
        const res = await request(app).
        get('/api/v1/teachers/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Teacher ID must be a valid UUID');
    });

    test('should return 404 when teacher not found', async () => {
        const res = await request(app).
        get('/api/v1/teachers/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');
    });

    test('should return 200 and teacher data for valid id', async () => {
        const res = await request(app).
        get(`/api/v1/teachers/${teacher.id}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', teacher.id);
        expect(res.body.data).toHaveProperty('email', 'jane@example.com');
    });
});
