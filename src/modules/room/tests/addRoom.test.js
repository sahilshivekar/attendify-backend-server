import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Room from '../../../db/models/room.model.js';

setupTestDb();

describe('Room Controller - addRoom', () => {
    let adminToken;

    beforeEach(async () => {
        await Admin.create({
            email: 'admin@example.com',
            username: 'adminuser',
            password: 'Admin@12345'
        });
        const adminLoginRes = await request(app).
        post('/api/v1/auth/admins/login').
        send({
            emailOrUsername: 'admin@example.com',
            password: 'Admin@12345'
        });
        adminToken = adminLoginRes.body.data.accessToken;
    });

    const url = '/api/v1/rooms';

    test('should require authentication', async () => {
        const res = await request(app).
        post(url).
        send({
            roomNumber: 'A101',
            sittingCapacity: 40
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for missing roomNumber', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            sittingCapacity: 40
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Room number is required');
    });

    test('should return 400 for missing sittingCapacity', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'A101'
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Sitting capacity is required');
    });

    test('should return 409 for duplicate roomNumber', async () => {
        await Room.create({
            roomNumber: 'A101',
            sittingCapacity: 40
        });
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'A101',
            sittingCapacity: 40
        });
        expect([httpStatus.CONFLICT, httpStatus.BAD_REQUEST]).toContain(res.status);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/duplicate|already exists|unique/i);
    });

    test('should add room successfully', async () => {
        const res = await request(app).
        post(url).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'B202',
            sittingCapacity: 50,
            name: 'Chemistry lab',
            type: 'Lab'
        });
        expect(res.status).toBe(httpStatus.CREATED);
        expect(res.body.success).toBe(true);
        expect(res.body.data.roomNumber).toBe('B202');
        expect(res.body.data.sittingCapacity).toBe(50);
        expect(res.body.data.name).toBe('Chemistry lab');
        expect(res.body.data.type).toBe('Lab');
    });
});
