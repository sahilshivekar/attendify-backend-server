import request from 'supertest';
import httpStatus from 'http-status';
import path from 'path';
import fs from 'fs';
import setupTestDb from '../../util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

let app;

import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Student API - PUT /api/v1/students/image', () => {
    let adminToken, studentToken;
    let university, branch, scheme, student;

    const safeUnlink = (filePath) => {
        try {
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {

        }
    };

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
            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: 'admin@example.com',
                password: 'Admin@12345'
            });
            adminToken = adminLoginRes.body.data.accessToken;

            university = await University.create({
                name: 'Test University',
                abbreviation: 'TU',
                address: '123 Test St',
                establishedYear: 2000
            });

            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS',
                code: 'CS',
                universityId: university.id
            });

            scheme = await Scheme.create({
                name: 'Test Scheme 2025',
                year: 2025,
                universityId: university.id
            });

            student = await Student.create({
                prn: 'CS20250001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                phoneNumber: '+911234567890',
                password: 'Student@123',
                gender: 'Male',
                admissionYear: 2025,
                admissionType: 'FE',
                universityId: university.id,
                branchId: branch.id,
                schemeId: scheme.id
            });

            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: student.email,
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    const createTestImage = (filename = 'test-image.jpg') => {
        const testImagePath = path.join(process.cwd(), 'public', 'temp', filename);
        const imageBuffer = Buffer.from('fake-image-data');
        fs.writeFileSync(testImagePath, imageBuffer);
        return testImagePath;
    };

    describe('Authentication Tests', () => {
        it('should fail with 401 if no token provided', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            safeUnlink(imagePath);
        });

        it('should fail with 401 if invalid token provided', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', 'Bearer invalid_token').
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            safeUnlink(imagePath);
        });

        it('should fail with 403 if student token used', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${studentToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.FORBIDDEN);
            safeUnlink(imagePath);
        });

        it('should pass with valid admin token', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.OK);
            safeUnlink(imagePath);
        });
    });

    describe('Validation Tests', () => {
        it('should fail with 400 if id is missing', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            safeUnlink(imagePath);
        });

        it('should fail with 400 if image file is missing', async () => {
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
        });

        it('should fail with 400 if id is not a valid UUID', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', 'invalid-uuid').
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            safeUnlink(imagePath);
        });
    });

    describe('Business Logic Tests', () => {
        it('should fail with 404 if student does not exist', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', '550e8400-e29b-41d4-a716-446655440000').
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.NOT_FOUND);
            safeUnlink(imagePath);
        });

        it('should pass with valid data and successful cloudinary upload', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.OK);
            safeUnlink(imagePath);
        });
    });

    describe('Success Tests', () => {
        it('should successfully upload image and update student record', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            safeUnlink(imagePath);
        });

        it('should return correct response structure', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body).toHaveProperty('success', true);
            expect(response.body).toHaveProperty('data');
            safeUnlink(imagePath);
        });

        it('should include updated student data in response', async () => {
            const imagePath = createTestImage();
            const response = await request(app).
            put('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`).
            field('id', student.id).
            attach('studentImageFile', imagePath);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.data.student.firstName).toBe(student.firstName);
            expect(response.body.data.student.lastName).toBe(student.lastName);
            expect(response.body.data.student.email).toBe(student.email);
            safeUnlink(imagePath);
        });
    });
});
