import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin API - updateAdminDetails', () => {
    let adminToken;
    let existingAdmin;

    beforeEach(async () => {

        existingAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!'
        });

        const loginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: existingAdmin.email,
            password: 'TestPass123!'
        });

        adminToken = loginRes.body.data.accessToken;
    });

    describe('PUT /api/v1/admins/me', () => {
        test('should update admin details when request is valid', async () => {
            const updateData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Admin details updated successfully');
            expect(res.body.data).toMatchObject({
                email: updateData.email,
                username: updateData.username
            });
            expect(res.body.data).not.toHaveProperty('password');

            const dbAdmin = await Admin.findByPk(existingAdmin.id);
            expect(dbAdmin.email).toBe(updateData.email);
            expect(dbAdmin.username).toBe(updateData.username);
        });

        test('should return 400 when email is invalid', async () => {
            const invalidData = {
                email: 'invalid-email',
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Please provide a valid email address');
        });

        test('should return 400 when username is too short', async () => {
            const invalidData = {
                email: faker.internet.email().toLowerCase(),
                username: 'ab'
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(invalidData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Username must be at least 3 characters long');
        });

        test('should return 400 when no changes detected', async () => {
            const noChangeData = {
                email: existingAdmin.email,
                username: existingAdmin.username
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(noChangeData).
            expect(httpStatus.BAD_REQUEST);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('No changes detected. The username and email are the same as the current ones.');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const updateData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            send(updateData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const updateData = {
                email: faker.internet.email().toLowerCase(),
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', 'Bearer invalidtoken').
            send(updateData).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 409 when email already exists', async () => {
            const duplicateEmail = faker.internet.email().toLowerCase();
            await Admin.create({
                email: duplicateEmail,
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            });

            const updateData = {
                email: duplicateEmail,
                username: faker.internet.username().toLowerCase()
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.CONFLICT);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('This email is already in use');
        });

        test('should return 409 when username already exists', async () => {
            const duplicateUsername = faker.internet.username().toLowerCase();
            await Admin.create({
                email: faker.internet.email().toLowerCase(),
                username: duplicateUsername,
                password: 'TestPass123!'
            });

            const updateData = {
                email: faker.internet.email().toLowerCase(),
                username: duplicateUsername
            };

            const res = await request(app).
            put('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            send(updateData).
            expect(httpStatus.CONFLICT);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('This username is already in use');
        });
    });
});
