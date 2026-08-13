import httpStatus from 'http-status';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Student from '../../../db/models/student.model.js';
import Admin from '../../../db/models/admin.model.js';

setupTestDb();

describe('Student API - GET /api/v1/students/:id', () => {
    let adminToken;
    let student;

    beforeEach(async () => {
        try {

            const adminData = {
                username: 'admin',
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@test.com',
                password: 'Admin@12345',
                role: 'Admin',
                university: {
                    universityName: 'Test University',
                    password: 'Admin@12345'
                }
            };

            await Admin.create(adminData);

            const adminLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: 'admin@test.com',
                password: 'Admin@12345'
            });

            adminToken = adminLoginRes.body.data.accessToken;

            const university = await University.create({
                name: 'Test University',
                abbreviation: 'TU',
                address: 'Test Address',
                contactEmail: 'test@university.com',
                contactPhone: '1234567890',
                establishedYear: 2000,
                websiteUrl: 'https://testuniversity.com'
            });

            const branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS',
                branchCode: 'CS101',
                branchName: 'Computer Engineering',
                universityId: university.id,
                isActive: true
            });

            const scheme = await Scheme.create({
                name: 'Test Scheme 2025',
                schemeCode: 'TS2025',
                schemeName: 'Test Scheme',
                academicStartYear: 2025,
                academicEndYear: 2028,
                duration: 4,
                branchId: branch.id,
                universityId: university.id,
                isActive: true
            });

            student = await Student.create({
                prn: 'TEST123456',
                firstName: 'John',
                lastName: 'Doe',
                middleName: 'M',
                email: 'john.doe@test.com',
                phoneNumber: '1234567890',
                gender: 'Male',
                password: 'Student@123',
                admissionYear: 2023,
                admissionType: 'FE',
                schemeId: scheme.id,
                branchId: branch.id
            });
        } catch (error) {
            console.error('Setup error:', error);
            throw error;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 without token', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized request: No token provided');
        });

        test('should return 401 with invalid token', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
        });

        test('should allow Admin to access student details', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 for invalid UUID format', async () => {
            const res = await request(app).
            get('/api/v1/students/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should handle empty student ID path gracefully', async () => {
            const res = await request(app).
            get('/api/v1/students/').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 for non-existent student', async () => {
            const nonExistentId = 'b84c9e52-c8b4-4a19-8b1d-123456789abc';

            const res = await request(app).
            get(`/api/v1/students/${nonExistentId}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Student not found');
        });
    });

    describe('Success Tests', () => {
        test('should return valid student data with associations', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Student fetched successfully');
            expect(res.body.data).toHaveProperty('id', student.id);
            expect(res.body.data).toHaveProperty('prn', student.prn);
            expect(res.body.data).toHaveProperty('firstName', student.firstName);
            expect(res.body.data).toHaveProperty('lastName', student.lastName);
            expect(res.body.data).toHaveProperty('email', student.email);
            expect(res.body.data).toHaveProperty('phoneNumber', student.phoneNumber);
            expect(res.body.data).toHaveProperty('gender', student.gender);
            expect(res.body.data).toHaveProperty('admissionYear', student.admissionYear);
            expect(res.body.data).toHaveProperty('admissionType', student.admissionType);
            expect(res.body.data).toHaveProperty('schemeId', student.schemeId);
            expect(res.body.data).toHaveProperty('branchId', student.branchId);

            expect(res.body.data).toHaveProperty('Branch');
            expect(res.body.data.Branch).toHaveProperty('name');
            expect(res.body.data).toHaveProperty('Scheme');
            expect(res.body.data.Scheme).toHaveProperty('name');
        });

        test('should not expose sensitive fields like password', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data).not.toHaveProperty('password');
            expect(res.body.data).not.toHaveProperty('refreshToken');
        });

        test('should return correct student associations', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.Branch).toHaveProperty('name', 'Computer Science');
            expect(res.body.data.Branch).toHaveProperty('abbreviation', 'CS');
            expect(res.body.data.Scheme).toHaveProperty('name', 'Test Scheme 2025');
            expect(res.body.data.Scheme).toHaveProperty('universityId');
        });

        test('should return proper API response structure', async () => {
            const res = await request(app).
            get(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body).toHaveProperty('success', true);
            expect(res.body).toHaveProperty('message', 'Student fetched successfully');
            expect(res.body).toHaveProperty('data');
            expect(typeof res.body.data).toBe('object');
            expect(res.body.data).not.toBeNull();
        });
    });
});
