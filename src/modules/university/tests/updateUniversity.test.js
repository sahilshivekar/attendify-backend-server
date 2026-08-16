import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';

setupTestDb();

describe('University API - PUT /api/v1/universities/:id', () => {
    let adminToken;
    let teacherToken;
    let uni;

    beforeEach(async () => {
        try {
            uni = await University.create({
                name: 'Old Name',
                abbreviation: 'ON'
            });

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
        const res = await request(app).put(`/api/v1/universities/${uni.id}`).send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for non-admin (teacher)', async () => {
        const res = await request(app).
        put(`/api/v1/universities/${uni.id}`).
        set('Authorization', `Bearer ${teacherToken}`).
        send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for invalid UUID', async () => {
        const res = await request(app).
        put('/api/v1/universities/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    test('should return 400 for empty body', async () => {
        const res = await request(app).
        put(`/api/v1/universities/${uni.id}`).
        set('Authorization', `Bearer ${adminToken}`).
        send({});
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Provide at least one field to update');
    });

    test('should return 404 when university not found', async () => {
        const res = await request(app).
        put('/api/v1/universities/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'New Name'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('University not found');
    });

    test('should update fields successfully', async () => {
        const res = await request(app).
        put(`/api/v1/universities/${uni.id}`).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            name: 'New Name',
            abbreviation: 'NN'
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('name', 'New Name');
        expect(res.body.data).toHaveProperty('abbreviation', 'NN');
    });
});
