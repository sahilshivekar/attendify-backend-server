import {
    jest
} from '@jest/globals';
import request from 'supertest';
import httpStatus from 'http-status';
import {
    v4 as uuidv4
} from 'uuid';
import app from '../../../app.js';
import setupTestDb from '../../util/setupTestDb.js';
import Admin from '../../../db/models/admin.model.js';
import Room from '../../../db/models/room.model.js';

setupTestDb();

describe('Room Controller - updateRoom', () => {
    let adminToken;
    let room;

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

        room = await Room.create({
            roomNumber: 'A101',
            sittingCapacity: 40
        });
    });

    const url = '/api/v1/rooms';

    test('should require authentication', async () => {
        const res = await request(app).
        put(`${url}/${room.id}`).
        send({
            roomNumber: 'A102',
            sittingCapacity: 45
        });
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for invalid room id', async () => {
        const res = await request(app).
        put(`${url}/not-a-uuid`).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'A102',
            sittingCapacity: 45
        });
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Room ID must be a valid UUID/i);
    });

    test('should return 404 for non-existent room', async () => {
        const randomId = uuidv4();
        const res = await request(app).
        put(`${url}/${randomId}`).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'A102',
            sittingCapacity: 45
        });
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Room not found');
    });

    test('should return 400 for missing roomNumber and sittingCapacity', async () => {
        const res = await request(app).
        put(`${url}/${room.id}`).
        set('Authorization', `Bearer ${adminToken}`).
        send({});
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Provide at least one field to update');
    });

    test('should update room successfully', async () => {
        const res = await request(app).
        put(`${url}/${room.id}`).
        set('Authorization', `Bearer ${adminToken}`).
        send({
            roomNumber: 'A102',
            sittingCapacity: 45,
            name: 'HOD office',
            type: 'Office'
        });
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(res.body.data.roomNumber).toBe('A102');
        expect(res.body.data.sittingCapacity).toBe(45);
        expect(res.body.data.name).toBe('HOD office');
        expect(res.body.data.type).toBe('Office');
    });
});
