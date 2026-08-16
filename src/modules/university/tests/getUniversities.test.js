import request from 'supertest';
import httpStatus from 'http-status';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';

import Admin from '../../../db/models/admin.model.js';
import Teacher from '../../../db/models/teacher.model.js';
import University from '../../../db/models/university.model.js';

setupTestDb();

describe('University API - GET /api/v1/universities', () => {
    let adminToken;
    let teacherToken;

    beforeEach(async () => {
        try {

            await University.create({
                name: 'State University',
                abbreviation: 'SU'
            });
            await University.create({
                name: 'National Institute',
                abbreviation: 'NI'
            });

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

            await Teacher.create({
                firstName: 'John',
                lastName: 'Doe',
                email: 'teacher@example.com',
                phoneNumber: '+911234567890',
                password: 'Teacher@123',
                gender: 'Male',
                role: 'Teacher'
            });
            const teacherLoginRes = await request(app).
            post('/api/v1/auth/teachers/login').
            send({
                email: 'teacher@example.com',
                password: 'Teacher@123'
            });
            teacherToken = teacherLoginRes.body.data.accessToken;
        } catch (err) {

            console.error('beforeEach setup error:', err);
            throw err;
        }
    });

    test('should return 401 when no token is provided', async () => {
        const res = await request(app).get('/api/v1/universities');
        expect(res.status).toBe(httpStatus.UNAUTHORIZED);
    });

    test('should allow Admin to list universities', async () => {
        const res = await request(app).get('/api/v1/universities').set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
        const names = res.body.data.map((u) => u.name).sort();
        expect(names).toEqual(expect.arrayContaining(['State University', 'National Institute']));
    });

    test('should allow Teacher to list universities', async () => {
        const res = await request(app).get('/api/v1/universities').set('Authorization', `Bearer ${teacherToken}`);
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
    });
});
