import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import {
    faker
} from '@faker-js/faker';
import httpStatus from 'http-status';

setupTestDb();

describe('Admin API - getAdmins', () => {
    let adminToken;
    let existingAdmin;

    beforeEach(async () => {

        existingAdmin = await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!'
        });

        await Admin.create({
            email: faker.internet.email().toLowerCase(),
            username: faker.internet.username().toLowerCase(),
            password: 'TestPass123!'
        });

        await Admin.create({
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

    describe('GET /api/v1/admins', () => {
        test('should return all admins when no query parameters', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Admins retrieved successfully.');
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toBeGreaterThanOrEqual(3);
        });

        test('should search admins by email', async () => {
            const searchEmail = 'test@example.com';
            await Admin.create({
                email: searchEmail,
                username: faker.internet.username().toLowerCase(),
                password: 'TestPass123!'
            });

            const res = await request(app).
            get('/api/v1/admins').
            query({
                searchQuery: 'test@example.com'
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].email).toBe(searchEmail);
        });

        test('should search admins by username', async () => {
            const searchUsername = 'testuser123';
            await Admin.create({
                email: faker.internet.email().toLowerCase(),
                username: searchUsername,
                password: 'TestPass123!'
            });

            const res = await request(app).
            get('/api/v1/admins').
            query({
                searchQuery: 'testuser123'
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(1);
            expect(res.body.data[0].username).toBe(searchUsername);
        });

        test('should sort admins by username ascending', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            query({
                sortBy: 'username',
                sortOrder: 'ASC'
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(1);

            for (let i = 1; i < res.body.data.length; i++) {
                expect(res.body.data[i - 1].username.localeCompare(res.body.data[i].username)).toBeLessThanOrEqual(0);
            }
        });

        test('should sort admins by email descending', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            query({
                sortBy: 'email',
                sortOrder: 'DESC'
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBeGreaterThan(1);

            for (let i = 1; i < res.body.data.length; i++) {
                expect(res.body.data[i - 1].email.localeCompare(res.body.data[i].email)).toBeGreaterThanOrEqual(0);
            }
        });

        test('should paginate results', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            query({
                page: 1,
                limit: 2
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
        });

        test('should return empty array when page exceeds available data', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            query({
                page: 100,
                limit: 10
            }).
            set('Authorization', `Bearer ${adminToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(0);
        });

        test('should return 401 when no authorization token is provided', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 when invalid token is provided', async () => {
            const res = await request(app).
            get('/api/v1/admins').
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
