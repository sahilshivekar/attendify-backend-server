import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Teacher from '../../../db/models/teacher.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Teacher Auth API - updateTeacherPassword', () => {
    let testTeacher;
    let teacherToken;

    beforeEach(async () => {
        testTeacher = await Teacher.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@test.com',
            phoneNumber: '+911234567890',
            gender: 'Female',
            role: 'Teacher',
            password: 'TestPass123!'
        });

        const loginRes = await request(app).
        post('/api/v1/auth/teachers/login').
        send({
            email: testTeacher.email,
            password: 'TestPass123!'
        });
        teacherToken = loginRes.body.data.accessToken;
    });

    describe('PUT /api/v1/auth/teachers/update-password', () => {
        test('should update teacher password successfully', async () => {
            const res = await request(app).
            put('/api/v1/auth/teachers/update-password').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            }).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password updated successfully');
            expect(res.body.data).toBeNull();

            const updated = await Teacher.findByPk(testTeacher.id);
            const matchNew = await updated.isPasswordMatching('NewPass123!');
            expect(matchNew).toBe(true);
            const matchOld = await updated.isPasswordMatching('TestPass123!');
            expect(matchOld).toBe(false);
        });

        test('should return 400 when new password is same as old', async () => {
            const res = await request(app).
            put('/api/v1/auth/teachers/update-password').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                password: 'TestPass123!',
                confirmPassword: 'TestPass123!'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("New password can't be same as old password.");
        });

        test('should return 400 when password is missing', async () => {
            const res = await request(app).
            put('/api/v1/auth/teachers/update-password').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                confirmPassword: 'NewPass123!'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password is required');
        });

        test('should return 400 when confirmPassword is missing', async () => {
            const res = await request(app).
            put('/api/v1/auth/teachers/update-password').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                password: 'NewPass123!'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Confirm password is required');
        });

        test('should return 400 when password and confirmPassword do not match', async () => {
            const res = await request(app).
            put('/api/v1/auth/teachers/update-password').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                password: 'NewPass123!',
                confirmPassword: 'DiffPass123!'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password and confirm password must match');
        });
    });
});
