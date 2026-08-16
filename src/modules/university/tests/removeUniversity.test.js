import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';

setupTestDb();

describe('University API - DELETE /api/v1/universities/:id', () => {
    let adminToken;
    let teacherToken;
    let uni;

    beforeEach(async () => {
        try {
            uni = await University.create({
                name: 'To Remove',
                abbreviation: 'TR'
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
        const res = await request(app).delete(`/api/v1/universities/${uni.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for non-admin (teacher)', async () => {
        const res = await request(app).
        delete(`/api/v1/universities/${uni.id}`).
        set('Authorization', `Bearer ${teacherToken}`);
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for invalid UUID', async () => {
        const res = await request(app).
        delete('/api/v1/universities/not-a-uuid').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });

    test('should return 404 when university not found', async () => {
        const res = await request(app).
        delete('/api/v1/universities/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('University not found');
    });

    test('should delete successfully (204) and not return body', async () => {
        const res = await request(app).
        delete(`/api/v1/universities/${uni.id}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
    });
});
