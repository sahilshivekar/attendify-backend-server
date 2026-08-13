import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Teacher from '../../../db/models/teacher.model.js';
import VerificationCode from '../../../db/models/verificationCode.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Teacher Auth API - verifyCode', () => {
    let testTeacher;
    let teacherToken;

    beforeEach(async () => {
        testTeacher = await Teacher.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: faker.internet.email().toLowerCase(),
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

        await VerificationCode.create({
            email: testTeacher.email,
            code: '123456',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000)
        });
    });

    describe('POST /api/v1/auth/teachers/verify-code', () => {
        test('should verify code successfully and login teacher', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                email: testTeacher.email,
                code: '123456'
            }).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Verification successful!');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherRefreshToken'))).toBe(true);

            const record = await VerificationCode.findOne({
                where: {
                    email: testTeacher.email
                }
            });
            expect(record).toBeNull();

            const updated = await Teacher.findByPk(testTeacher.id);
            expect(updated.refreshToken).toBe(res.body.data.refreshToken);
        });

        test('should return 400 for missing email', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                code: '123456'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email is required');
        });

        test('should return 400 for missing code', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                email: testTeacher.email
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Code is required');
        });

        test('should return 400 for invalid email format', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                email: 'invalid-email',
                code: '123456'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 for code with wrong length', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                email: testTeacher.email,
                code: '12345'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Code must be 6 characters long');
        });

        test('should return 400 when verification code is invalid', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/verify-code').
            set('Authorization', `Bearer ${teacherToken}`).
            send({
                email: testTeacher.email,
                code: '000000'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid verification code');

            const record = await VerificationCode.findOne({
                where: {
                    email: testTeacher.email
                }
            });
            expect(record).toBeTruthy();
        });
    });
});
