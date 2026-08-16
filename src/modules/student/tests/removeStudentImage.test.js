import request from 'supertest';
import httpStatus from 'http-status';
import setupTestDb from '../../../test/util/setupTestDb.js';
import {
    jest
} from '@jest/globals';

let app;
let uploadOnCloudinary, deleteFromCloudinary;

import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';

setupTestDb();

describe('Student API - DELETE /api/v1/students/image', () => {
    let adminToken, studentToken;
    let university, branch, scheme, student, studentWithImage;

    beforeAll(async () => {

        uploadOnCloudinary = jest.fn();
        deleteFromCloudinary = jest.fn();

        await jest.unstable_mockModule('../../../utils/cloudinary.js', () => ({
            uploadOnCloudinary,
            deleteFromCloudinary
        }));

        const mod = await import('../../../app.js');
        app = mod.default;
    });

    beforeEach(async () => {

        uploadOnCloudinary.mockReset();
        deleteFromCloudinary.mockReset();

        uploadOnCloudinary.mockResolvedValue({
            url: 'http://cloudinary.example.com/fake.jpg',
            secure_url: 'https://cloudinary.example.com/fake.jpg',
            public_id: 'fake_public_id'
        });
        deleteFromCloudinary.mockResolvedValue({
            result: 'ok'
        });

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
            delete('/api/v1/students/image').
            query({
                studentId: studentWithImage.id
            });

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Unauthorized request');
        });

        test('should return 401 when invalid token provided', async () => {
            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: studentWithImage.id
            }).
            set('Authorization', 'Bearer invalid-token');

            expect(response.status).toBe(httpStatus.UNAUTHORIZED);
            expect(response.body.success).toBe(false);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when studentId is missing', async () => {
            const response = await request(app).
            delete('/api/v1/students/image').
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Student ID is required');
        });

        test('should return 400 when studentId is invalid UUID', async () => {
            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: 'invalid-uuid'
            }).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Student ID must be a valid UUID');
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when student not found', async () => {
            const nonExistentId = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';

            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: nonExistentId
            }).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.NOT_FOUND);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Student not found');
        });

        test('should return 400 when student has no image to remove', async () => {
            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: student.id
            }).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.BAD_REQUEST);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('There is no student image uploaded to remove');
        });

        test('should return 500 when cloudinary deletion fails', async () => {

            deleteFromCloudinary.mockResolvedValueOnce(null);

            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: studentWithImage.id
            }).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Error deleting image');
        });
    });

    describe('Success Tests', () => {
        beforeEach(() => {

            jest.clearAllMocks();
        });

        test('should successfully remove student image as admin', async () => {

            deleteFromCloudinary.mockResolvedValueOnce({
                result: 'ok'
            });

            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: studentWithImage.id
            }).
            set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student image deleted successfully');
            expect(response.body.data).toBeDefined();
            expect(response.body.data.studentImgUrl).toBe(null);
            expect(response.body.data.studentImgPublicId).toBe(null);

            expect(deleteFromCloudinary).toHaveBeenCalledWith('test_image_public_id');
            expect(deleteFromCloudinary).toHaveBeenCalledTimes(1);

            const updatedStudent = await Student.findByPk(studentWithImage.id);
            expect(updatedStudent.studentImgUrl).toBe(null);
            expect(updatedStudent.studentImgPublicId).toBe(null);
        });

        test('should successfully remove student image as student (own image)', async () => {

            const ownStudent = await Student.create({
                firstName: 'Own',
                lastName: 'Image',
                email: 'ownimage@example.com',
                prn: 'PRN777777',
                phoneNumber: '7777777777',
                password: 'Student@123',
                gender: 'Female',
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id,
                schemeId: scheme.id,
                studentImgUrl: 'https://cloudinary.com/own/image.jpg',
                studentImgPublicId: 'own_image_public_id',
                isActive: true
            });

            const ownStudentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'ownimage@example.com',
                password: 'Student@123'
            });
            const ownStudentToken = ownStudentLoginRes.body.data.accessToken;

            deleteFromCloudinary.mockResolvedValueOnce({
                result: 'ok'
            });

            const response = await request(app).
            delete('/api/v1/students/image').
            query({
                studentId: ownStudent.id
            }).
            set('Authorization', `Bearer ${ownStudentToken}`);

            expect(response.status).toBe(httpStatus.OK);
            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe('Student image deleted successfully');
            expect(response.body.data.studentImgUrl).toBe(null);
            expect(response.body.data.studentImgPublicId).toBe(null);

            expect(deleteFromCloudinary).toHaveBeenCalledWith('own_image_public_id');
        });
    });
});
