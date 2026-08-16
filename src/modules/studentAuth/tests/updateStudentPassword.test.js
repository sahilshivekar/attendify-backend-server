import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Student from '../../../db/models/student.model.js';
import University from '../../../db/models/university.model.js';
import Scheme from '../../../db/models/scheme.model.js';
import Branch from '../../../db/models/branch.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Student Auth API - updateStudentPassword', () => {
    let testStudent;
    let testUniversity;
    let testScheme;
    let testBranch;
    let studentToken;

    beforeEach(async () => {

        testUniversity = await University.create({
            name: 'Test University',
            abbreviation: 'TU'
        });

        testScheme = await Scheme.create({
            name: 'Test Scheme',
            universityId: testUniversity.id
        });

        testBranch = await Branch.create({
            name: 'Computer Science',
            abbreviation: 'CS'
        });

        testStudent = await Student.create({
            prn: 'TU2025001',
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@test.com',
            phoneNumber: '1234567890',
            password: 'TestPass123!',
            schemeId: testScheme.id,
            branchId: testBranch.id,
            admissionYear: 2025,
            admissionType: 'FE',
            gender: "Male"
        });

        const loginRes = await request(app).
        post('/api/v1/auth/students/login').
        send({
            emailOrPRN: testStudent.email,
            password: 'TestPass123!'
        });

        studentToken = loginRes.body.data.accessToken;
    });

    describe('PUT /api/v1/auth/students/update-password', () => {
        test('should update student password successfully', async () => {
            const updateData = {
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password updated successfully');
            expect(res.body.data).toBeNull();

            const updatedStudent = await Student.findByPk(testStudent.id);
            const isNewPasswordMatching = await updatedStudent.isPasswordMatching('NewPass123!');
            expect(isNewPasswordMatching).toBe(true);

            const isOldPasswordMatching = await updatedStudent.isPasswordMatching('TestPass123!');
            expect(isOldPasswordMatching).toBe(false);
        });

        test('should return 400 when new password is same as old', async () => {
            const updateData = {
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('New password can\'t be same as old password.');
        });

        test('should return 400 when password is missing', async () => {
            const updateData = {
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password is required');
        });

        test('should return 400 when confirmPassword is missing', async () => {
            const updateData = {
                password: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Confirm password is required');
        });

        test('should return 400 when password and confirmPassword do not match', async () => {
            const updateData = {
                password: 'NewPass123!',
                confirmPassword: 'DifferentPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password and confirm password must match');
        });

        test('should return 400 when password is too short', async () => {
            const updateData = {
                password: '12345',
                confirmPassword: '12345'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
        });

        test('should return 400 when password lacks uppercase', async () => {
            const updateData = {
                password: 'newpass123!',
                confirmPassword: 'newpass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password must contain at least one uppercase letter');
        });

        test('should return 400 when password lacks number', async () => {
            const updateData = {
                password: 'NewPass!',
                confirmPassword: 'NewPass!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password must contain at least one number');
        });

        test('should return 400 when password lacks special character', async () => {
            const updateData = {
                password: 'NewPass123',
                confirmPassword: 'NewPass123'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', `Bearer ${studentToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password must contain at least one special character');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const updateData = {
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            send(updateData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const updateData = {
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/students/update-password').
            set('Authorization', 'Bearer invalidtoken').
            send(updateData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
