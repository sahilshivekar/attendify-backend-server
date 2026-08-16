import request from 'supertest';
import httpStatus from 'http-status';
import path from 'path';
import fs from 'fs';
import setupTestDb from '../../../test/util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

let app;

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';

setupTestDb();

describe('Teacher API - PUT /api/v1/teachers/image', () => {
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
                firstName: 'Pic',
                lastName: 'Ture',
                email: 'pic@example.com',
                phoneNumber: '+911234599999',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).put('/api/v1/teachers/image').field('id', teacher.id);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should return 400 when file is missing', async () => {
        const res = await request(app).
        put('/api/v1/teachers/image').
        set('Authorization', `Bearer ${adminToken}`).
        field('id', teacher.id);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.message).toBe('Teacher image file is required');
    });

    test('should return 404 when teacher not found', async () => {
        const tmpDir = path.join(process.cwd(), 'public', 'temp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {
            recursive: true
        });
        const tmpFile = path.join(tmpDir, 'test-image.jpg');
        fs.writeFileSync(tmpFile, Buffer.from([1, 2, 3, 4]));

        const res = await request(app).
        put('/api/v1/teachers/image').
        set('Authorization', `Bearer ${adminToken}`).
        field('id', 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').
        attach('teacherImageFile', tmpFile);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.message).toBe('Teacher not found');
    });

    test('should update teacher image successfully', async () => {
        const tmpDir = path.join(process.cwd(), 'public', 'temp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, {
            recursive: true
        });
        const tmpFile = path.join(tmpDir, 'test-image.jpg');
        fs.writeFileSync(tmpFile, Buffer.from([1, 2, 3, 4]));

        const res = await request(app).
        put('/api/v1/teachers/image').
        set('Authorization', `Bearer ${adminToken}`).
        field('id', teacher.id).
        attach('teacherImageFile', tmpFile);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.data).toHaveProperty('teacherImageUrl');
        expect(res.body.data).toHaveProperty('teacherImagePublicId');
    });
});
