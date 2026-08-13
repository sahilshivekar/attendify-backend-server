import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Teacher from '../../../db/models/teacher.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Teacher Auth API - loginTeacher', () => {
    let testTeacher;

    beforeEach(async () => {
        try {
            testTeacher = await Teacher.create({
                firstName: 'Jane',
                lastName: 'Doe',
                email: faker.internet.email().toLowerCase(),
                phoneNumber: '+911234567890',
                gender: 'Female',
                role: 'Teacher',
                password: 'TestPass123!'
            });
        } catch (error) {
            console.error('Error creating test teacher:', error);
        }
    });

    describe('POST /api/v1/auth/teachers/login', () => {
        test('should login teacher successfully', async () => {
            const data = {
                email: testTeacher.email,
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login Successful');
            expect(res.body.data).toMatchObject({
                teacher: {
                    id: testTeacher.id,
                    email: testTeacher.email,
                    firstName: testTeacher.firstName,
                    lastName: testTeacher.lastName
                },
                accessToken: expect.any(String),
                refreshToken: expect.any(String)
            });
            expect(res.body.data.teacher).not.toHaveProperty('password');
            expect(res.body.data.teacher).not.toHaveProperty('refreshToken');

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherAccessToken'))).toBe(true);
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherRefreshToken'))).toBe(true);
        });

        test('should return 404 when teacher not found', async () => {
            const data = {
                email: 'nonexistent@test.com',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.NOT_FOUND);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No teacher found with entered credentials');
        });

        test('should return 401 when password is incorrect', async () => {
            const data = {
                email: testTeacher.email,
                password: 'WrongPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe("Password didn't match");
        });

        test('should return 400 when email is missing', async () => {
            const data = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Email is required');
        });

        test('should return 400 when password is missing', async () => {
            const data = {
                email: testTeacher.email
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password is required');
        });

        test('should return 400 when email format is invalid', async () => {
            const data = {
                email: 'invalid-email',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/teachers/login').
            send(data).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });
    });
});
