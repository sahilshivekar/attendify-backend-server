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

setupTestDb();

describe('Student API - PUT /api/v1/students/:id', () => {
    let adminToken;
    let studentToken;
    let university;
    let branch;
    let branch2;
    let scheme;
    let scheme2;
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
            branch2 = await Branch.create({
                name: 'Information Technology',
                abbreviation: 'IT'
            });
            scheme = await Scheme.create({
                name: 'CS 2026 Scheme',
                universityId: university.id
            });
            scheme2 = await Scheme.create({
                name: 'IT 2026 Scheme',
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

            const studentLoginRes = await request(app).
            post('/api/v1/auth/students/login').
            send({
                emailOrPRN: 'student@example.com',
                password: 'Student@123'
            });
            studentToken = studentLoginRes.body.data.accessToken;
        } catch (err) {
            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    describe('Authentication Tests', () => {
        test('should return 401 when no token is provided', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', 'Bearer invalidtoken').
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        });

        test('should allow Admin to update student', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.OK);
        });

        test('should allow Student to update their own details', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${studentToken}`).
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.OK);
        });
    });

    describe('Validation Tests', () => {
        test('should return 400 when student ID is invalid UUID', async () => {
            const res = await request(app).
            put('/api/v1/students/invalid-uuid').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Student ID must be a valid UUID');
        });

        test('should return 400 when no fields are provided to update', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({});
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Provide at least one field to update');
        });

        test('should return 400 when firstName is too short', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: ''
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('is not allowed to be empty');
        });

        test('should return 400 when lastName is too short', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                lastName: ''
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('is not allowed to be empty');
        });

        test('should return 400 when email is invalid', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                email: 'invalid-email'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 when gender is invalid', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                gender: 'InvalidGender'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain("Gender must be one of 'Male', 'Female', or 'Other'");
        });

        test('should return 400 when schemeId is invalid UUID', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                schemeId: 'invalid-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Scheme ID must be a valid UUID');
        });

        test('should return 400 when branchId is invalid UUID', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                branchId: 'invalid-uuid'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Branch ID must be a valid UUID');
        });

        test('should return 400 when parentEmail is invalid', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                parentEmail: 'invalid-email'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Parent email must be a valid email');
        });

        test('should return 400 when admissionYear is invalid', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                admissionYear: 'invalid-year'
            });
            expect(res.status).toBe(httpStatus.BAD_REQUEST);
            expect(res.body.message).toContain('Admission year must be a number');
        });
    });

    describe('Business Logic Tests', () => {
        test('should return 404 when student does not exist', async () => {
            const res = await request(app).
            put('/api/v1/students/aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'Updated'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Student not found');
        });

        test('should return 404 when scheme does not exist', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                schemeId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Scheme not found');
        });

        test('should return 404 when branch does not exist', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                branchId: 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa'
            });
            expect(res.status).toBe(httpStatus.NOT_FOUND);
            expect(res.body.message).toBe('Branch not found');
        });
    });

    describe('Success Tests', () => {
        test('should update student firstName successfully', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'UpdatedJohn'
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student updated successfully');
            expect(res.body.data.firstName).toBe('UpdatedJohn');
            expect(res.body.data.lastName).toBe('Doe');
        });

        test('should update multiple fields successfully', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'UpdatedJohn',
                lastName: 'UpdatedDoe',
                email: 'updated@example.com',
                phoneNumber: '+919876543211',
                gender: 'Female',
                middleName: 'Middle',
                dob: '1999-01-01',
                parentEmail: 'parent@example.com',
                prn: 'STU002',
                admissionYear: 2023,
                admissionType: 'DSE'
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student updated successfully');
            expect(res.body.data.firstName).toBe('UpdatedJohn');
            expect(res.body.data.lastName).toBe('UpdatedDoe');
            expect(res.body.data.email).toBe('updated@example.com');
            expect(res.body.data.phoneNumber).toBe('+919876543211');
            expect(res.body.data.gender).toBe('Female');
            expect(res.body.data.middleName).toBe('Middle');
            expect(res.body.data.dob).toBe('1999-01-01');
            expect(res.body.data.parentEmail).toBe('parent@example.com');
            expect(res.body.data.prn).toBe('STU002');
            expect(res.body.data.admissionYear).toBe(2023);
            expect(res.body.data.admissionType).toBe('DSE');
        });

        test('should update schemeId successfully', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                schemeId: scheme2.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student updated successfully');
            expect(res.body.data.schemeId).toBe(scheme2.id);
        });

        test('should update branchId successfully', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                branchId: branch2.id
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student updated successfully');
            expect(res.body.data.branchId).toBe(branch2.id);
        });

        test('should verify student is updated in database', async () => {
            await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'DatabaseTestName'
            });

            const updatedStudent = await Student.findByPk(student.id);
            expect(updatedStudent.firstName).toBe('DatabaseTestName');
        });

        test('should preserve unchanged fields when updating', async () => {
            const originalEmail = student.email;
            const originalPhone = student.phoneNumber;

            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                firstName: 'OnlyFirstNameUpdated'
            });

            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.data.firstName).toBe('OnlyFirstNameUpdated');
            expect(res.body.data.email).toBe(originalEmail);
            expect(res.body.data.phoneNumber).toBe(originalPhone);
        });

        test('should handle optional field updates correctly', async () => {
            const res = await request(app).
            put(`/api/v1/students/${student.id}`).
            set('Authorization', `Bearer ${adminToken}`).
            send({
                middleName: 'NewMiddleName',
                parentEmail: 'parent@example.com'
            });
            expect(res.status).toBe(httpStatus.OK);
            expect(res.body.message).toBe('Student updated successfully');
        });
    });
});
