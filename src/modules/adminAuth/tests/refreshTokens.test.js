import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - refreshTokens', () => {
    let adminToken;
    let refreshToken;
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
        refreshToken = loginRes.body.data.refreshToken;
    });

    describe('POST /api/v1/auth/admins/access-token', () => {
        test('should refresh tokens successfully with valid refresh token', async () => {
            const refreshData = {
                refreshToken: refreshToken
            };

            const res = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Access token refreshed successfully');
            expect(res.body.data).toHaveProperty('accessToken');
            expect(res.body.data).toHaveProperty('refreshToken');
            expect(res.body.data.accessToken).toBeTruthy();
            expect(res.body.data.refreshToken).toBeTruthy();

            expect(res.body.data.accessToken).not.toBe(adminToken);
            expect(res.body.data.refreshToken).not.toBe(refreshToken);

            const verifyRes = await request(app).
            post('/api/v1/auth/admins/verify-password').
            set('Authorization', `Bearer ${res.body.data.accessToken}`).
            send({
                password: 'TestPass123!'
            }).
            expect(httpStatus.OK);

            expect(verifyRes.body.success).toBe(true);
        });

        test('should return 400 for missing refresh token', async () => {
            const refreshData = {};

            const res = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Refresh token is required');
        });

        test('should return 401 for invalid refresh token', async () => {
            const refreshData = {
                refreshToken: 'invalid-refresh-token'
            };

            const res = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should return 401 for expired refresh token', async () => {

            const expiredRefreshToken = 'expired-refresh-token';

            const refreshData = {
                refreshToken: expiredRefreshToken
            };

            const res = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should return 404 when admin associated with refresh token not found', async () => {

            await Admin.destroy({
                where: {
                    id: existingAdmin.id
                }
            });

            const refreshData = {
                refreshToken: refreshToken
            };

            const res = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid refresh token');
        });

        test('should invalidate old refresh token after successful refresh', async () => {
            const refreshData = {
                refreshToken: refreshToken
            };

            const firstRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.OK);

            const secondRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.OK);

            expect(secondRefreshRes.body.success).toBe(true);
            expect(secondRefreshRes.body.message).toBe('Access token refreshed successfully');
        });

        test('should handle multiple refresh requests sequentially', async () => {
            const refreshData = {
                refreshToken: refreshToken
            };

            const firstRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.OK);

            expect(firstRefreshRes.body.success).toBe(true);

            const secondRefreshData = {
                refreshToken: firstRefreshRes.body.data.refreshToken
            };

            const secondRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(secondRefreshData).
            expect(httpStatus.OK);

            expect(secondRefreshRes.body.success).toBe(true);

            const thirdRefreshData = {
                refreshToken: secondRefreshRes.body.data.refreshToken
            };

            const thirdRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(thirdRefreshData).
            expect(httpStatus.OK);

            expect(thirdRefreshRes.body.success).toBe(true);
        });

        test('should return different tokens on each refresh', async () => {
            const refreshData = {
                refreshToken: refreshToken
            };

            const firstRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(refreshData).
            expect(httpStatus.OK);

            const newRefreshToken = firstRefreshRes.body.data.refreshToken;

            const secondRefreshData = {
                refreshToken: newRefreshToken
            };

            const secondRefreshRes = await request(app).
            post('/api/v1/auth/admins/access-token').
            send(secondRefreshData).
            expect(httpStatus.OK);

            expect(secondRefreshRes.body.data.accessToken).not.toBe(
                firstRefreshRes.body.data.accessToken
            );
            expect(secondRefreshRes.body.data.refreshToken).not.toBe(
                firstRefreshRes.body.data.refreshToken
            );
        });
    });
});
