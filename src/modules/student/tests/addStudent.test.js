import {
    jest
} from '@jest/globals';
import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Branch from '../../../db/models/branch.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import httpStatus from 'http-status';
import fs from 'fs';
import path from 'path';

setupTestDb();

describe('Student API - POST /api/v1/students', () => {
    let adminToken;
    let teacherToken;
    let studentToken;
    let university;
    let branch;
    let scheme;

    beforeEach(async () => {
        try {

            const {
                uploadOnCloudinary
            } = await import('../../../utils/cloudinary.js');
            jest.spyOn({
                uploadOnCloudinary
            }, 'uploadOnCloudinary').mockResolvedValue({
                url: 'http://cloudinary.example.com/fake.jpg',
                secure_url: 'https://cloudinary.example.com/fake.jpg',
                public_id: 'fake_public_id'
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
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).
            post('/api/v1/students').
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', 'Bearer invalidtoken').
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should allow Admin to add student', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.CREATED);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when prn is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('PRN is required');
        });

        test('should return 400 when firstName is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('First name is required');
        });

        test('should return 400 when lastName is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Last name is required');
        });

        test('should return 400 when email is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Email is required');
        });

        test('should return 400 when email is invalid', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 when phoneNumber is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Phone number is required');
        });

        test('should return 400 when gender is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Gender is required');
        });

        test('should return 400 when gender is invalid', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'InvalidGender',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain("Gender must be one of 'Male', 'Female', or 'Other'");
        });

        test('should return 400 when schemeId is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Scheme ID is required');
        });

        test('should return 400 when schemeId is invalid UUID', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: 'invalid-uuid',
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Scheme ID must be a valid UUID');
        });

        test('should return 400 when branchId is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Branch ID is required');
        });

        test('should return 400 when branchId is invalid UUID', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: 'invalid-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Branch ID must be a valid UUID');
        });

        test('should return 400 when admissionYear is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Admission year is required');
        });

        test('should return 400 when admissionType is missing', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Admission type is required');
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 400 when student with email already exists', async () => {

            await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });

            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU002',
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'john@example.com',
                phoneNumber: '+919876543211',
                gender: 'Female',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toBe('A student with this email already exists');
        });

        test('should return 404 when scheme does not exist', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa',
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Scheme not found');
        });

        test('should return 404 when branch does not exist', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Branch not found');
        });
    });

    describe('Success Tests', () => {
        test('should create student successfully with all required fields', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.message).toBe('Student added successfully');
            expect(res.body.data).toHaveProperty('id');
            expect(res.body.data.firstName).toBe('John');
            expect(res.body.data.lastName).toBe('Doe');
            expect(res.body.data.email).toBe('john@example.com');
            expect(res.body.data.prn).toBe('STU001');
        });

        test('should create student successfully with optional fields', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                middleName: 'Michael',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                dob: '1999-01-01',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id,
                parentEmail: 'parent@example.com'
            });
            expect(res.status).toBe(httpStatus.CREATED);
            expect(res.body.message).toBe('Student added successfully');
            expect(res.body.data.middleName).toBe('Michael');
            expect(res.body.data.parentEmail).toBe('parent@example.com');
            expect(res.body.data.dob).toBe('1999-01-01');
        });

        test('should verify student is created in database', async () => {
            const res = await request(app).
            post('/api/v1/students').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                prn: 'STU001',
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phoneNumber: '+919876543210',
                gender: 'Male',
                schemeId: scheme.id,
                admissionYear: 2025,
                admissionType: 'FE',
                branchId: branch.id
            });
            expect(res.status).toBe(httpStatus.CREATED);

            const student = await Student.findOne({
                where: {
                    email: 'john@example.com'
                }
            });
            expect(student).toBeTruthy();
            expect(student.firstName).toBe('John');
            expect(student.prn).toBe('STU001');
        });
    });
});
