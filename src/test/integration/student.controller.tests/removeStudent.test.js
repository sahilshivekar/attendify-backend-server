import request from 'supertest';
import httpStatus from 'http-status';
import setupTestDb from '../../util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

let app;
let deleteFromCloudinary;

import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Student API - DELETE /api/v1/students/:id', () => {
    let adminToken, studentToken;
    let university, branch, scheme, student, studentWithImage;

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
        const cloudinaryModule = await import('../../../utils/cloudinary.js');
        deleteFromCloudinary = cloudinaryModule.deleteFromCloudinary;

        const mod = await import('../../../app.js');
        app = mod.default;
    });

    beforeEach(async () => {

        university = await University.create({
            name: 'Test University',
            abbreviation: 'TU',
            address: 'Test Address',
            contactEmail: 'test@university.com',
            contactPhone: '1234567890',
            establishedYear: 2000,
            websiteUrl: 'https://testuniversity.com'
        });

        branch = await Branch.create({
            name: 'Computer Science',
            abbreviation: 'CS',
            branchCode: 'CS101',
            universityId: university.id,
            isActive: true
        });

        scheme = await Scheme.create({
            name: 'Test Scheme 2025',
            schemeCode: 'TS2025',
            academicStartYear: 2025,
            academicEndYear: 2028,
            duration: 4,
            branchId: branch.id,
            universityId: university.id,
            isActive: true
        });

        await Admin.create({
            email: 'admin@example.com',
            username: 'adminuser',
            password: 'Admin@12345'
        });

        studentWithImage = await Student.create({
            firstName: 'Test',
            lastName: 'Student',
            email: 'test@example.com',
            prn: 'PRN123456',
            phoneNumber: '1234567890',
            password: 'Student@123',
            gender: 'Male',
            admissionYear: 2025,
            admissionType: 'FE',
            branchId: branch.id,
            schemeId: scheme.id,
            studentImgUrl: 'https://cloudinary.com/test/image.jpg',
            studentImgPublicId: 'test_image_public_id',
            isActive: true
        });

        student = await Student.create({
            firstName: 'Login',
            lastName: 'Student',
            email: 'login@example.com',
            prn: 'PRN987654',
            phoneNumber: '9876543210',
            password: 'Student@123',
            gender: 'Female',
            admissionYear: 2025,
            admissionType: 'FE',
            branchId: branch.id,
            schemeId: scheme.id,
            isActive: true
        });

        const adminLoginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        adminToken = adminLoginRes.body.data.accessToken;

        const studentLoginRes = await request(app).
        post('/api/v1/auth/students/login').
        send({
            emailOrPRN: 'login@example.com',
            password: 'Student@123'
        });
        studentToken = studentLoginRes.body.data.accessToken;
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token provided', async () => {
            const response = await request(app).
            delete(`/api/v1/students/${student.id}`);

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Unauthorized request');
        });

        test('should return 401 when invalid token provided', async () => {
            const response = await request(app).
            delete(`/api/v1/students/${student.id}`).
            set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            expect(response.body.success).toBe(false);
        });

        test('should return 403 when student tries to access', async () => {
            const response = await request(app).
            delete(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${studentToken}`);

            expect(response.status).toBe(httpStatus.FORBIDDEN);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Forbidden');
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when student ID is invalid UUID', async () => {
            const response = await request(app).
            delete('/api/v1/students/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should return 400 when student ID is missing', async () => {
            const response = await request(app).
            delete('/api/v1/students/').
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.NOT_FOUND);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 400 for invalid student ID format', async () => {
            const response = await request(app).
            delete('/api/v1/students/invalid-id').
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('valid UUID');
        });
    });

    describe('Success Tests', () => {
        test('should successfully delete student without image', async () => {
            const response = await request(app).
            delete(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student deleted successfully');
            expect(response.body.data).toBe(null);

            const deletedStudent = await Student.findByPk(student.id);
            expect(deletedStudent).toBe(null);
        });

        test('should successfully delete student with image', async () => {
            const response = await request(app).
            delete(`/api/v1/students/${studentWithImage.id}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student deleted successfully');
            expect(response.body.data).toBe(null);

            const deletedStudent = await Student.findByPk(studentWithImage.id);
            expect(deletedStudent).toBe(null);
        });

        test('should handle cascading deletion properly', async () => {

            const cascadeStudent = await Student.create({
                firstName: 'Cascade',
                lastName: 'Test',
                email: 'cascade@example.com',
                prn: 'PRN555555',
                phoneNumber: '5555555555',
                password: 'Student@123',
                gender: 'Male',
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id,
                schemeId: scheme.id,
                isActive: true
            });

            const response = await request(app).
            delete(`/api/v1/students/${cascadeStudent.id}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student deleted successfully');

            const deletedStudent = await Student.findByPk(cascadeStudent.id);
            expect(deletedStudent).toBe(null);
        });

        test('should handle deletion when cloudinary fails gracefully', async () => {

            const response = await request(app).
            delete(`/api/v1/students/${studentWithImage.id}`).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student deleted successfully');

            const deletedStudent = await Student.findByPk(studentWithImage.id);
            expect(deletedStudent).toBe(null);
        });
    });
});
