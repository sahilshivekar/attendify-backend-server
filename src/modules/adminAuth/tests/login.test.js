import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - login', () => {
    let existingAdmin;

    beforeEach(async () => {

        existingAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!',
            isVerified: true
        });
    });

    describe('POST /api/v1/auth/admins/login', () => {
        test('should login successfully with valid email and password', async () => {
            const loginData = {
                emailOrUsername: existingAdmin.email,
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login Successful');
            expect(res.body.data).toHaveProperty('admin');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.admin.email).toBe(existingAdmin.email);
            expect(res.body.data.admin.username).toBe(existingAdmin.username);

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('adminAccessToken='))).toBe(true);
            expect(res.headers['set-cookie'].some((cookie) => cookie.includes('adminRefreshToken='))).toBe(true);
        });

        test('should login successfully with valid username and password', async () => {
            const loginData = {
                emailOrUsername: existingAdmin.username,
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Login Successful');
            expect(res.body.data.admin.username).toBe(existingAdmin.username);
        });

        test('should return 401 for invalid email', async () => {
            const loginData = {
                emailOrUsername: 'nonexistent@example.com',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or username');
        });

        test('should return 401 for invalid username', async () => {
            const loginData = {
                emailOrUsername: 'nonexistentuser',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid email or username');
        });

        test('should return 401 for invalid password', async () => {
            const loginData = {
                emailOrUsername: existingAdmin.email,
                password: 'WrongPassword123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid password');
        });

        test('should return 400 for missing emailOrUsername', async () => {
            const loginData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Email or username is required');
        });

        test('should return 400 for missing password', async () => {
            const loginData = {
                emailOrUsername: existingAdmin.email
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 for invalid email format', async () => {
            const loginData = {
                emailOrUsername: 'invalid-email',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/login').
            send(loginData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('email');
        });
    });
});
