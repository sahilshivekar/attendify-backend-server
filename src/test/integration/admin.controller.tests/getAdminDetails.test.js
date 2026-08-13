import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin API - getAdminDetails', () => {
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

    describe('GET /api/v1/admins/me', () => {
        test('should return admin details successfully', async () => {
            const res = await request(app).
            get('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Admin details retrieved successfully');
            expect(res.body.data).toMatchObject({
                id: existingAdmin.id,
                email: existingAdmin.email,
                username: existingAdmin.username
            });
            expect(res.body.data).toHaveProperty('password');
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app).
            get('/api/v1/admins/me').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            get('/api/v1/admins/me').
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 as the admin record is not in db he must be unauthorized user at that time', async () => {

            await Admin.destroy({
                where: {
                    id: existingAdmin.id
                }
            });

            const res = await request(app).
            get('/api/v1/admins/me').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toBe('Invalid Access Token: User not found');
        });
    });
});
