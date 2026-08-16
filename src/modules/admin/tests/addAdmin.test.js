import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';
import {
    logger
} from '../../../config/logger.js';

setupTestDb();

describe('Admin API - addAdmin', () => {
    let adminToken;
    let existingAdmin;

    beforeEach(async () => {

        existingAdmin = await Admin.create({
            email: 'sahilshivekar@gmail.com',
            username: 'sahilshivekar',
            password: 'Sahil@54321'
        });

        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: existingAdmin.email,
            password: 'Sahil@54321'
        });
        adminToken = loginRes.body.data.accessToken;
    });

    describe('POST /api/v1/admins', () => {
        test('should create a new admin when request is valid', async () => {
            const newAdminData = {
                email: 'vedantkulkarni@gmail.com',
                username: 'vedantkulkarni',
                password: 'Vedant@54321'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(newAdminData).
            expect(httpStatus.CREATED);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Admin added successfully');
            expect(res.body.data).toMatchObject({
                email: newAdminData.email,
                username: newAdminData.username
            });
            expect(res.body.data).not.toHaveProperty('password');

            const dbAdmin = await Admin.findOne({
                where: {
                    email: newAdminData.email
                }
            });
            expect(dbAdmin).toBeTruthy();
            expect(dbAdmin.username).toBe(newAdminData.username);
        });

        test('should return 400 when email is invalid', async () => {
            const invalidData = {
                email: 'invalid-email',
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 when username is too short', async () => {
            const invalidData = {
                email: faker.internet.email().toLowerCase(),
                username: 'ab',
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Username must be at least 3 characters long');
        });

        test('should return 400 when password is weak', async () => {
            const invalidData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase(),
                password: 'weak'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password must contain at least one uppercase letter');
        });

        test('should return 400 when email is missing', async () => {
            const invalidData = {
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Email is required');
        });

        test('should return 400 when username is missing', async () => {
            const invalidData = {
                email: faker.internet.email().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Username is required');
        });

        test('should return 400 when password is missing', async () => {
            const invalidData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Password is required');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const newAdminData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            send(newAdminData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const newAdminData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', 'Bearer invalidtoken').
            send(newAdminData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 409 when email already exists', async () => {
            const duplicateEmail = 'duplicate@example.com';
            await Admin.create({
                email: duplicateEmail,
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            });

            const newAdminData = {
                email: duplicateEmail,
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            send(newAdminData).
            expect(httpStatus.CONFLICT);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('This email is already in use');
        });
    });
});
