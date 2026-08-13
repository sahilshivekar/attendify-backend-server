import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Student API - PUT /api/v1/students/password', () => {
    let adminToken;
    let university;
    let branch;
    let scheme;
    let student;

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
                abbreviation: 'TU'
            });
            branch = await Branch.create({
                name: 'Computer Science',
                abbreviation: 'CS'
            });
            scheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: university.id
            });

            student = await Student.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'student@example.com',
                phoneNumber: '+919876543210',
                prn: 'STU001',
                password: 'Student@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Male'
            });
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            send({
                id: student.id,
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', 'Bearer invalidtoken').
            send({
                id: student.id,
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should allow Admin to update student password', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.OK);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when student ID is missing', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID is required');
        });

        test('should return 400 when student ID is invalid UUID', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: 'invalid-uuid',
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should return 400 when password is missing', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Password is required');
        });

        test('should return 400 when password is too short', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: '1234567',
                confirmPassword: '1234567'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Password must be at least 8 characters');
        });

        test('should return 400 when password is too long', async () => {
            const longPassword = 'a'.repeat(129);
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: longPassword,
                confirmPassword: longPassword
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Password cannot exceed 128 characters');
        });

        test('should return 400 when confirmPassword is missing', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Confirm password is required');
        });

        test('should return 400 when password and confirmPassword do not match', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: 'NewPassword@123',
                confirmPassword: 'DifferentPassword@123'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Password and confirm password must match');
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when student does not exist', async () => {
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
                password: 'NewPassword@123',
                confirmPassword: 'NewPassword@123'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Student not found');
        });
    });

    describe('Success Tests', () => {
        test('should update student password successfully', async () => {
            const newPassword = 'NewPassword@123';
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: newPassword,
                confirmPassword: newPassword
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student password updated successfully');
            expect(res.body.data).toBeDefined();
            expect(res.body.data.id).toBe(student.id);
        });

        test('should verify password is updated in database', async () => {
            const newPassword = 'DatabaseTestPassword@123';

            await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: newPassword,
                confirmPassword: newPassword
            });

            const loginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: student.email,
                password: newPassword
            });
            expect(loginRes.status).toBe(httpStatus.OK);
            expect(loginRes.body.data.accessToken).toBeDefined();
        });

        test('should handle minimum valid password length', async () => {
            const minPassword = 'Test123!';
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: minPassword,
                confirmPassword: minPassword
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student password updated successfully');
        });

        test('should handle maximum valid password length', async () => {
            const maxPassword = 'A1!' + 'a'.repeat(125);
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student.id,
                password: maxPassword,
                confirmPassword: maxPassword
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student password updated successfully');
        });

        test('should update password for different students', async () => {

            const student2 = await Student.create({
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'student2@example.com',
                phoneNumber: '+919876543211',
                prn: 'STU002',
                password: 'Student2@123',
                schemeId: scheme.id,
                branchId: branch.id,
                admissionYear: 2025,
                admissionType: 'FE',
                gender: 'Female'
            });

            const newPassword = 'NewPassword@456';
            const res = await request(app).
            put('/api/v1/students/password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                id: student2.id,
                password: newPassword,
                confirmPassword: newPassword
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student password updated successfully');
            expect(res.body.data.id).toBe(student2.id);
        });
    });
});
