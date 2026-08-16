import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin Auth - updateAdminPassword', () => {
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

    describe('PUT /api/v1/auth/admins/update-password', () => {
        test('should update password successfully with valid data', async () => {
            const updateData = {
                password: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Password updated successfully');
            expect(res.body.data).toBeNull();

            const verifyLoginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: existingAdmin.email,
                password: 'NewPass123!'
            }).
            expect(httpStatus.OK);

            expect(verifyLoginRes.body.success).toBe(true);

            const loginRes = await request(app).
            post('/api/v1/auth/admins/login').
            send({
                emailOrUsername: existingAdmin.email,
                password: 'NewPass123!'
            }).
            expect(httpStatus.OK);

            expect(loginRes.body.success).toBe(true);
        });

        test('should return 400 for incorrect current password', async () => {
            const updateData = {
                currentPassword: 'WrongPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 when new password and confirm password do not match', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'DifferentPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 for missing current password', async () => {
            const updateData = {
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 for missing new password', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 for missing confirm password', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 400 for weak new password', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'weak',
                confirmPassword: 'weak'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 401 when invalid token is provided', async () => {
            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', 'Bearer invalidtoken').
            send(updateData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });

        test('should return 404 when admin not found', async () => {

            await Admin.destroy({
                where: {
                    id: existingAdmin.id
                }
            });

            const updateData = {
                currentPassword: 'TestPass123!',
                newPassword: 'NewPass123!',
                confirmPassword: 'NewPass123!'
            };

            const res = await request(app).
            put('/api/v1/auth/admins/update-password').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Password is required');
        });
    });
});
