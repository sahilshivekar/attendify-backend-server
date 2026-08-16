import request from 'supertest';
import httpStatus from 'http-status';
import path from 'path';
import fs from 'fs';
import setupTestDb from '../../../test/util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

let app;

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

setupTestDb();

describe('Teacher API - POST /api/v1/teachers', () => {
    let adminToken;

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
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).
        post('/api/v1/teachers').
        field('firstName', 'Sam').
        field('lastName', 'Smith').
        field('email', 'sam@example.com').
        field('phoneNumber', '+911234567891').
        field('gender', 'Male').
        field('role', 'Teacher');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 403 for non-admin (teacher) token', async () => {
        await Teacher.create({
            firstName: 'Tina',
            lastName: 'Teach',
            email: 'tina@example.com',
            phoneNumber: '+911111111112',
            password: 'Teacher@123',
            gender: 'Female',
            role: 'Teacher'
        });
        const teacherLoginRes = await request(app).post('/api/v1/auth/teachers/login').send({
            email: 'tina@example.com',
            password: 'Teacher@123'
        });
        const teacherToken = teacherLoginRes.body.data.accessToken;
        const res = await request(app).
        post('/api/v1/teachers').
        set('Authorization', `Bearer ${teacherToken}`).
        field('firstName', 'Sam').
        field('lastName', 'Smith').
        field('email', 'sam@example.com').
        field('phoneNumber', '+911234567891').
        field('gender', 'Male').
        field('role', 'Teacher');
        expect(res.status).toBe(httpStatus.FORBIDDEN);
    });

    test('should return 400 for validation errors (missing required fields)', async () => {
        const res = await request(app).
        post('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        field('firstName', '').
        field('lastName', '').
        field('email', 'not-an-email').
        field('phoneNumber', '').
        field('gender', 'Unknown').
        field('role', 'Random');
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toBeDefined();
    });

    test('should return 400 when duplicate email is used', async () => {
        await Teacher.create({
            firstName: 'Existing',
            lastName: 'Teacher',
            email: 'dup@example.com',
            phoneNumber: '+911234500001',
            password: 'Teacher@123',
            gender: 'Male',
            role: 'Teacher'
        });
        const res = await request(app).
        post('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        field('firstName', 'Sam').
        field('lastName', 'Smith').
        field('email', 'dup@example.com').
        field('phoneNumber', '+911234567891').
        field('gender', 'Male').
        field('role', 'Teacher');
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('A teacher member with this email already exists');
    });

    test('should create teacher without image and return 201', async () => {
        const res = await request(app).
        post('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        field('firstName', 'Sam').
        field('lastName', 'Smith').
        field('email', 'sam@example.com').
        field('phoneNumber', '+911234567891').
        field('gender', 'Male').
        field('role', 'Teacher');
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data).toHaveProperty('email', 'sam@example.com');
        const found = await Teacher.findOne({
            where: {
                email: 'sam@example.com'
            }
        });
        expect(found).not.toBeNull();
    });

    test('should create teacher with image upload and return 201', async () => {

        const tmpDir = path.join(process.cwd(), 'public', 'temp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {
            recursive: true
        });
        const tmpFile = path.join(tmpDir, 'test-image.jpg');
        fs.writeFileSync(tmpFile, Buffer.from([1, 2, 3, 4]));

        const res = await request(app).
        post('/api/v1/teachers').
        set('Authorization', `Bearer ${adminToken}`).
        field('firstName', 'Ima').
        field('lastName', 'Gine').
        field('email', 'img@example.com').
        field('phoneNumber', '+911234567892').
        field('gender', 'Female').
        field('role', 'Teacher').
        attach('teacherImageFile', tmpFile);

        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.data).toHaveProperty('teacherImageUrl');
        expect(res.body.data).toHaveProperty('teacherImagePublicId');
    });
});
