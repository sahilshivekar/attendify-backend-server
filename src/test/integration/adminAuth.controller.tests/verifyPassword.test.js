import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - verifyPassword', () => {
    let adminToken;
    let existingAdmin;

    beforeEach(async () => {

        existingAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!',
            isVerified: true
        });

        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: existingAdmin.email,
            password: 'TestPass123!'
        });

        adminToken = loginRes.body.data.accessToken;
    });

    describe('POST /api/v1/auth/admins/verify-password', () => {
        test('should verify password successfully with correct password', async () => {
            const verifyData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(verifyData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password is correct');
            expect(res.body.data).toBeNull();
        });

        test('should return 401 for incorrect password', async () => {
            const verifyData = {
                password: 'WrongPassword123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(verifyData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is incorrect');
        });

        test('should return 400 for missing password', async () => {
            const verifyData = {};

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(verifyData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const verifyData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            send(verifyData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const verifyData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', 'Bearer invalidtoken').
            send(verifyData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 404 when admin not found', async () => {

            await Admin.destroy({
                where: {
                    id: existingAdmin.id
                }
            });

            const verifyData = {
                password: 'TestPass123!'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(verifyData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Access Token: User not found');
        });
    });
});
