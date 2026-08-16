import request from 'supertest';
import httpStatus from 'http-status';
import {
    faker
} from '@faker-js/faker';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Scheme API - POST /api/v1/schemes', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let existingScheme;

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
            existingScheme = await Scheme.create({
                name: 'Existing Scheme',
                universityId: university.id
            });

            await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student1@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: existingScheme.id,
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

    const validBody = () => ({
        name: 'CS 2026 Scheme',
        universityId: university.id
    });

    describe('Authentication/Authorization', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).post('/api/v1/schemes').send(validBody());
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', 'Bearer invalidtoken').
            send(validBody());
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
            expect(res.body.success).toBe(false);
        });

        test('should return 403 for Teacher token', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${teacherToken}`).
            send(validBody());
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
        });

        test('should return 403 for Student token', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${studentToken}`).
            send(validBody());
            expect(res.status).toBe(httpStatus.FORBIDDEN);
            expect(res.body.success).toBe(false);
        });
    });

    describe('Validation', () => {
        test('should return 400 when name is missing', async () => {
            const {
                name,
                ...body
            } = validBody();
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send(body);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Scheme name is required');
        });

        test('should return 400 when name is empty string', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                ...validBody(),
                name: ''
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('is not allowed to be empty');
        });

        test('should return 400 when universityId is missing', async () => {
            const {
                universityId,
                ...body
            } = validBody();
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send(body);
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('University ID is required');
        });

        test('should return 400 when universityId is not a UUID', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                ...validBody(),
                universityId: 'invalid-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('University ID must be a valid UUID');
        });
    });

    describe('Business logic', () => {
        test('should return 404 when university does not exist', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                name: 'Non Univ Scheme',
                universityId: faker.string.uuid()
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('University not found');
        });

        test('should create scheme successfully with admin token', async () => {
            const res = await request(app).
            post('/api/v1/schemes').
            set('Authorization', `Bearer ${adminToken}`).
            send(validBody());
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.success).toBe(true);
            expect(res.body.message).toContain('added successfully');
            expect(res.body.data).toMatchObject({
                name: 'CS 2026 Scheme',
                universityId: university.id
            });

            const schemeInDb = await Scheme.findByPk(res.body.data.id);
            expect(schemeInDb).not.toBeNull();
            expect(schemeInDb.name).toBe('CS 2026 Scheme');
            expect(schemeInDb.universityId).toBe(university.id);
        });
    });
});
