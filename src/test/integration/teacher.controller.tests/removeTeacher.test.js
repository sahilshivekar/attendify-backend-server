import request from 'supertest';
import httpStatus from 'http-status';
import setupTestDb from '../../util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

let app;

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('Teacher API - DELETE /api/v1/teachers', () => {
    let adminToken;
    let teacher;

    beforeAll(async () => {
        await jest.unstable_mockModule('../../../utils/cloudinary.js', () => ({
            uploadOnCloudinary: jest.fn(async () => ({
                url: 'http://cloudinary.example.com/fake.jpg',
                secure_url: 'https://cloudinary.example.com/fake.jpg',
                public_id: 'fake_public_id'
            })),
            deleteFromCloudinary: jest.fn(async () => ({
                result: 'ok'
            }))
        }));
        const mod = await import('../../../app.js');
        app = mod.default;
    });

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
                firstName: 'Rem',
                lastName: 'Ov',
                email: 'remov@example.com',
                phoneNumber: '+911234599997',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher',
                teacherImageUrl: 'https://cloudinary.example.com/fake.jpg',
                teacherImagePublicId: 'fake_public_id'
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).delete('/api/v1/teachers').query({
            id: teacher.id
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for teacher token (admin only)', async () => {
        const tLogin = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'remov@example.com',
            password: 'Teacher@123'
        });
        const teacherToken = tLogin.body.data.accessToken;
        const res = await request(app).delete('/api/v1/teachers').set('Authorization', `Bearer ${teacherToken}`).query({
            id: teacher.id
        });
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for invalid id', async () => {
        const res = await request(app).
        delete('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            id: 'not-a-uuid'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toContain('Teacher ID must be a valid UUID');
    });

    test('should return 404 when teacher not found', async () => {
        const res = await request(app).
        delete('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');
    });

    test('should delete teacher and return 204', async () => {
        const res = await request(app).
        delete('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        query({
            id: teacher.id
        });
        expect(res.status).toBe(httpStatus.OK);

        const found = await Teacher.findByPk(teacher.id);
        expect(found).toBeNull();
    });
});
