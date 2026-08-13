import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - logout', () => {
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

    describe('POST /api/v1/auth/admins/logout', () => {
        test('should logout successfully with valid token', async () => {
            const res = await request(app).
            post('/api/v1/auth/admins/logout').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Logged out successfully');
            expect(res.body.data).toBeDefined();

            const verifyRes = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${adminToken}`).
            send({
                password: 'TestPass123!'
            }).
            expect(httpStatus.OK);

            expect(verifyRes.body.success).toBe(true);
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app).
            post('/api/v1/auth/admins/logout').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            post('/api/v1/auth/admins/logout').
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when admin not found (token invalidated)', async () => {

            await Admin.destroy({
                where: {
                    id: existingAdmin.id
                }
            });

            const res = await request(app).
            post('/api/v1/auth/admins/logout').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Access Token: User not found');
        });

        test('should handle logout even if admin is already logged out', async () => {

            await request(app).
            post('/api/v1/auth/admins/logout').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            const res = await request(app).
            post('/api/v1/auth/admins/logout').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Logged out successfully');
        });
    });
});
