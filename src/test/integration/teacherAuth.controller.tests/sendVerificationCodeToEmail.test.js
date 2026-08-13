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

describe('Teacher Auth API - sendVerificationCodeToEmail', () => {
    let testTeacher;

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
    });

    describe('POST /api/v1/auth/teachers/send-verification-code', () => {
        test('should send verification code successfully', async () => {
            const requestData = {
                email: testTeacher.email
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/send-verification-code').
            send(requestData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(`Verification code sent on ${testTeacher.email}`);
            expect(res.body.data).toHaveProperty('expiresAt');

            const codes = await VerificationCode.findAll({
                where: {
                    email: testTeacher.email
                }
            });
            expect(codes.length).toBe(1);
            expect(codes[0].code).toMatch(/^\d{6}$/);
        });

        test('should handle email in uppercase', async () => {
            const requestData = {
                email: testTeacher.email.toUpperCase()
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/send-verification-code').
            send(requestData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe(`Verification code sent on ${testTeacher.email}`);
        });

        test('should return 404 when teacher does not exist', async () => {
            const requestData = {
                email: faker.internet.email().toLowerCase()
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/send-verification-code').
            send(requestData).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Teacher with this email doesn't exists");
        });

        test('should return 400 when email is missing', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/send-verification-code').
            send({}).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Email is required');
        });

        test('should return 400 when email is invalid', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/send-verification-code').
            send({
                email: 'invalid-email'
            }).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });
    });
});
