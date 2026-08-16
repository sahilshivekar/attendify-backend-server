import request from 'supertest';
import app from '../../../app.js';
import setupTestDb from '../../../test/util/setupTestDb.js';
import Teacher from '../../../db/models/teacher.model.js';
import httpStatus from 'http-status';

setupTestDb();

describe('Teacher Auth API - logout', () => {
    let testTeacher;
    let teacherToken;

    beforeEach(async () => {
        testTeacher = await Teacher.create({
            firstName: 'Jane',
            lastName: 'Doe',
            email: 'jane.doe@test.com',
            phoneNumber: '+911234567890',
            gender: 'Female',
            role: 'Teacher',
            password: 'TestPass123!'
        });

        const loginRes = await request(app).
        post('/api/v1/auth/teachers/login').
        send({
            email: testTeacher.email,
            password: 'TestPass123!'
        });
        teacherToken = loginRes.body.data.accessToken;
    });

    describe('POST /api/v1/auth/teachers/logout', () => {
        test('should logout teacher successfully', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/logout').
            set('Authorization', `Bearer ${teacherToken}`).
            expect(httpStatus.OK);

            expect(res.body.success).toBe(true);
            expect(res.body.message).toBe('Logged out successfully');
            expect(res.body.data).toBe("If you are not accessing this api from a browser then you must manually remove the tokens stored");

            expect(res.headers['set-cookie']).toBeDefined();
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherAccessToken=;'))).toBe(true);
            expect(res.headers['set-cookie'].some((c) => c.includes('teacherRefreshToken=;'))).toBe(true);

            const updated = await Teacher.findByPk(testTeacher.id);
            expect(updated.refreshToken).toBeNull();
        });

        test('should return 401 when no token provided', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/logout').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });

        test('should return 401 for invalid token', async () => {
            const res = await request(app).
            post('/api/v1/auth/teachers/logout').
            set('Authorization', 'Bearer invalidtoken').
            expect(httpStatus.UNAUTHORIZED);

            expect(res.body.success).toBe(false);
            expect(res.body.message).toContain('Unauthorized');
        });
    });
});
