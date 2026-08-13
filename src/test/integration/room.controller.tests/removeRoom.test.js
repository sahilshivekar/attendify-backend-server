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

describe('Room Controller - removeRoom', () => {
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
        delete(`${url}/${room.id}`);
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
        expect(res.body.success).toBe(false);
    });

    test('should return 400 for invalid room id', async () => {
        const res = await request(app).
        delete(`${url}/not-a-uuid`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.BAD_REQUEST);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toMatch(/Room ID must be a valid UUID/i);
    });

    test('should return 404 for non-existent room', async () => {
        const randomId = uuidv4();
        const res = await request(app).
        delete(`${url}/${randomId}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.NOT_FOUND);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toBe('Room not found');
    });

    test('should remove room successfully', async () => {
        const res = await request(app).
        delete(`${url}/${room.id}`).
        set('Authorization', `Bearer ${adminToken}`);
        expect([httpStatus.OK, httpStatus.OK]).toContain(res.status);
        if (res.status === httpStatus.OK) {
            expect(res.body.success).toBe(true);
            expect(res.body.data).toBe(null);
        }

        const deletedRoom = await Room.findByPk(room.id);
        expect(deletedRoom).toBeNull();
    });
});
